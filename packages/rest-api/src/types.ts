/**
 * Framework-agnostic types for the OtterSeal REST API
 */

export interface Note {
  content: string;
  expires_at: number | null;
  burn_after_reading: number;
  created_at: number | null;
  updated_at: number | null;
}

export interface NoteMetadata {
  expires_at: number | null;
  burn_after_reading: number;
  created_at: number | null;
  updated_at: number | null;
}

export interface GetNoteResponse {
  content: string;
  expiresAt: number | null;
  burnAfterReading: boolean;
}

export interface GetNoteMetadataResponse {
  exists: boolean;
  expiresAt: number | null;
  burnAfterReading: boolean;
}

export interface CreateNoteRequest {
  content: string;
  expiresAt?: number | null;
  burnAfterReading?: boolean;
}

export interface CreateNoteResponse {
  success: boolean;
}

export interface ErrorResponse {
  error: string;
}

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

/**
 * WebSocket message types
 */
export interface WSInitMessage {
  type: 'init';
  content: string;
}

export interface WSUpdateMessage {
  type: 'update';
  content: string;
}

export interface WSErrorMessage {
  type: 'error';
  message: string;
}

export type WSMessage = WSInitMessage | WSUpdateMessage | WSErrorMessage;
