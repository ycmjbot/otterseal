import {
  CreateNoteRequestSchema,
  GetNoteMetadataResponseSchema,
  GetNoteResponseSchema,
} from './schemas.js';
import type {
  CreateNoteResponse,
  ErrorResponse,
  GetNoteMetadataResponse,
  GetNoteResponse,
  NoteDatabase,
  NoteMetadata,
} from './types.js';

const MAX_ID_LENGTH = 64;

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
  body: unknown,
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
        return GetNoteMetadataResponseSchema.parse({
          exists: true,
          expiresAt: note.expires_at,
          burnAfterReading: note.burn_after_reading === 1,
        });
      } else {
        const note = await db.getNote(id);
        if (!note) {
          return { error: 'Not found', status: 404 };
        }
        if (isExpired(note)) {
          await db.deleteNote(id);
          return { error: 'Expired', status: 410 };
        }

        const response = GetNoteResponseSchema.parse({
          content: note.content,
          expiresAt: note.expires_at,
          burnAfterReading: note.burn_after_reading === 1,
        });

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

  const createNote: CreateNoteHandler = async (id: string, body: unknown) => {
    if (!id || id.length > MAX_ID_LENGTH) {
      return { error: 'Invalid ID', status: 400 };
    }

    // Parse and validate request body with Zod
    const parseResult = CreateNoteRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { error: `Validation failed: ${errors.join(', ')}`, status: 400 };
    }

    const { content, expiresAt, burnAfterReading } = parseResult.data;

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
