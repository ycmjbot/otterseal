/**
 * Framework-agnostic types for the OtterSeal REST API
 * Re-exported from schemas.ts for convenience
 */

export type {
  CreateNoteRequest,
  CreateNoteResponse,
  ErrorResponse,
  GetNoteMetadataResponse,
  GetNoteResponse,
  Note,
  NoteMetadata,
  WSErrorMessage,
  WSInitMessage,
  WSMessage,
  WSUpdateMessage,
} from './schemas.js';

/**
 * Database interface - implementers provide their own database
 */
export interface NoteDatabase {
  getNote(id: string): Promise<Note | undefined>;
  getNoteMetadata(id: string): Promise<NoteMetadata | undefined>;
  upsertNote(
    id: string,
    content: string,
    expiresAt: number | null,
    burnAfterReading: boolean,
    createdAt: number,
    updatedAt: number,
  ): Promise<void>;
  deleteNote(id: string): Promise<void>;
  deleteExpiredNotes(): Promise<number>;
}

// Re-import for types only
import type { Note, NoteMetadata } from './schemas.js';
