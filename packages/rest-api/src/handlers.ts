import type {
  CreateNoteRequest,
  CreateNoteResponse,
  ErrorResponse,
  GetNoteMetadataResponse,
  GetNoteResponse,
  NoteDatabase,
  NoteMetadata,
} from './types.js';

const MAX_ID_LENGTH = 64;
const MAX_CONTENT_LENGTH = 100 * 1024;

function isExpired(note: NoteMetadata): boolean {
  return note.expires_at !== null && note.expires_at < Date.now();
}

export interface APIHandlerContext {
  db: NoteDatabase;
  logger?: (msg: string) => void;
}

/**
 * Framework-agnostic handler types
 * Implementers wrap these in their framework's request/response handling
 */

export type GetNoteHandler = (
  id: string,
  peek?: boolean,
) => Promise<
  GetNoteResponse | GetNoteMetadataResponse | ErrorResponse | { error: string; status: number }
>;

export type CreateNoteHandler = (
  id: string,
  body: CreateNoteRequest,
) => Promise<CreateNoteResponse | ErrorResponse | { error: string; status: number }>;

/**
 * Create REST API handlers for a given database
 */
export function createAPIHandlers(context: APIHandlerContext) {
  const { db, logger = () => {} } = context;

  const getNote: GetNoteHandler = async (id: string, peek = false) => {
    if (!id || id.length > MAX_ID_LENGTH) {
      return { error: 'Invalid ID', status: 400 };
    }

    try {
      if (peek) {
        const note = await db.getNoteMetadata(id);
        if (!note) {
          return { error: 'Not found', status: 404 };
        }
        if (isExpired(note)) {
          await db.deleteNote(id);
          return { error: 'Expired', status: 410 };
        }
        return {
          exists: true,
          expiresAt: note.expires_at,
          burnAfterReading: note.burn_after_reading === 1,
        };
      } else {
        const note = await db.getNote(id);
        if (!note) {
          return { error: 'Not found', status: 404 };
        }
        if (isExpired(note)) {
          await db.deleteNote(id);
          return { error: 'Expired', status: 410 };
        }

        const response: GetNoteResponse = {
          content: note.content,
          expiresAt: note.expires_at,
          burnAfterReading: note.burn_after_reading === 1,
        };

        if (note.burn_after_reading === 1) {
          await db.deleteNote(id);
          logger(`Burned note ${id.slice(0, 8)}...`);
        }

        return response;
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger(`API error: ${err.message}`);
      return { error: 'Server error', status: 500 };
    }
  };

  const createNote: CreateNoteHandler = async (id: string, body: CreateNoteRequest) => {
    if (!id || id.length > MAX_ID_LENGTH) {
      return { error: 'Invalid ID', status: 400 };
    }
    const { content, expiresAt, burnAfterReading } = body;

    if (!content || typeof content !== 'string') {
      return { error: 'Content required', status: 400 };
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return { error: 'Content too large (max 100KB)', status: 400 };
    }

    try {
      const now = Date.now();
      await db.upsertNote(id, content, expiresAt || null, !!burnAfterReading, now, now);
      return { success: true };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger(`API error: ${err.message}`);
      return { error: 'Server error', status: 500 };
    }
  };

  return {
    getNote,
    createNote,
  };
}
