import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAPIHandlers } from './handlers.js';
import type { NoteDatabase } from './types.js';

/**
 * Mock database implementation for testing
 */
class MockDatabase implements NoteDatabase {
  private notes = new Map<
    string,
    {
      content: string;
      expires_at: number | null;
      burn_after_reading: number;
      created_at: number | null;
      updated_at: number | null;
    }
  >();

  async getNote(id: string) {
    return this.notes.get(id);
  }

  async getNoteMetadata(id: string) {
    const note = this.notes.get(id);
    if (!note) return undefined;
    return {
      expires_at: note.expires_at,
      burn_after_reading: note.burn_after_reading,
      created_at: note.created_at,
      updated_at: note.updated_at,
    };
  }

  async upsertNote(
    id: string,
    content: string,
    expiresAt: number | null,
    burnAfterReading: boolean,
    createdAt: number,
    updatedAt: number,
  ) {
    this.notes.set(id, {
      content,
      expires_at: expiresAt,
      burn_after_reading: burnAfterReading ? 1 : 0,
      created_at: createdAt,
      updated_at: updatedAt,
    });
  }

  async deleteNote(id: string) {
    this.notes.delete(id);
  }

  async deleteExpiredNotes() {
    let count = 0;
    for (const [id, note] of this.notes.entries()) {
      if (note.expires_at && note.expires_at < Date.now()) {
        this.notes.delete(id);
        count++;
      }
    }
    return count;
  }
}

describe('REST API Handlers', () => {
  let db: MockDatabase;
  let handlers: ReturnType<typeof createAPIHandlers>;
  let logger: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    db = new MockDatabase();
    logger = vi.fn();
    handlers = createAPIHandlers({ db, logger });
  });

  describe('getNote', () => {
    it('should return note content if exists', async () => {
      const now = Date.now();
      await db.upsertNote('test-note', 'Hello World', null, false, now, now);

      const result = await handlers.getNote('test-note');

      expect(result).toEqual({
        content: 'Hello World',
        expiresAt: null,
        burnAfterReading: false,
      });
    });

    it('should return 404 if note does not exist', async () => {
      const result = await handlers.getNote('non-existent');

      expect(result).toEqual({
        error: 'Not found',
        status: 404,
      });
    });

    it('should return 410 if note is expired', async () => {
      const pastTime = Date.now() - 60000; // 1 minute ago
      const now = Date.now();
      await db.upsertNote('expired-note', 'Old content', pastTime, false, now, now);

      const result = await handlers.getNote('expired-note');

      expect(result).toEqual({
        error: 'Expired',
        status: 410,
      });

      // Verify note was deleted
      const checkNote = await db.getNote('expired-note');
      expect(checkNote).toBeUndefined();
    });

    it('should delete note after burn_after_reading is read', async () => {
      const now = Date.now();
      await db.upsertNote('burn-note', 'Secret content', null, true, now, now);

      const result = await handlers.getNote('burn-note');

      expect(result).toEqual({
        content: 'Secret content',
        expiresAt: null,
        burnAfterReading: true,
      });

      // Verify note was deleted
      const checkNote = await db.getNote('burn-note');
      expect(checkNote).toBeUndefined();
    });

    it('should return 400 for invalid ID (too long)', async () => {
      const tooLongId = 'a'.repeat(100);

      const result = await handlers.getNote(tooLongId);

      expect(result).toEqual({
        error: 'Invalid ID',
        status: 400,
      });
    });

    it('should peek without deleting burn_after_reading notes', async () => {
      const now = Date.now();
      await db.upsertNote('burn-note', 'Secret', null, true, now, now);

      const result = await handlers.getNote('burn-note', true);

      expect(result).toEqual({
        exists: true,
        expiresAt: null,
        burnAfterReading: true,
      });

      // Verify note still exists
      const checkNote = await db.getNote('burn-note');
      expect(checkNote).not.toBeUndefined();
    });

    it('should peek and return 404 if note not found', async () => {
      const result = await handlers.getNote('non-existent', true);

      expect(result).toEqual({
        error: 'Not found',
        status: 404,
      });
    });
  });

  describe('createNote', () => {
    it('should create a note successfully', async () => {
      const result = await handlers.createNote('new-note', {
        content: 'My content',
        burnAfterReading: false,
      });

      expect(result).toEqual({ success: true });

      const note = await db.getNote('new-note');
      expect(note).toBeDefined();
      expect(note?.content).toBe('My content');
    });

    it('should create note with expiration', async () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      const result = await handlers.createNote('expiring-note', {
        content: 'Temporary content',
        expiresAt: futureTime,
      });

      expect(result).toEqual({ success: true });

      const note = await db.getNote('expiring-note');
      expect(note?.expires_at).toBe(futureTime);
    });

    it('should create note with burn_after_reading', async () => {
      const result = await handlers.createNote('burn-note', {
        content: 'Secret',
        burnAfterReading: true,
      });

      expect(result).toEqual({ success: true });

      const note = await db.getNote('burn-note');
      expect(note?.burn_after_reading).toBe(1);
    });

    it('should return 400 if content is empty', async () => {
      const result = await handlers.createNote('empty-note', {
        content: '',
      });

      expect(result.status).toBe(400);
      expect(result.error).toMatch(/[Cc]ontent/i);
    });

    it('should return 400 if content is missing', async () => {
      const result = await handlers.createNote('no-content-note', {
        content: undefined as unknown as string,
      });

      expect(result.status).toBe(400);
      expect(result.error).toMatch(/[Cc]ontent|[Rr]equired/i);
    });

    it('should return 400 if content exceeds max size', async () => {
      const tooLargeContent = 'x'.repeat(101 * 1024); // > 100KB

      const result = await handlers.createNote('large-note', {
        content: tooLargeContent,
      });

      expect(result.status).toBe(400);
      expect(result.error).toMatch(/[Cc]ontent.*[Ll]arge|too large/i);
    });

    it('should return 400 for invalid ID (too long)', async () => {
      const tooLongId = 'a'.repeat(100);

      const result = await handlers.createNote(tooLongId, {
        content: 'content',
      });

      expect(result).toEqual({
        error: 'Invalid ID',
        status: 400,
      });
    });

    it('should update existing note', async () => {
      const now = Date.now();
      await db.upsertNote('update-note', 'Old content', null, false, now, now);

      const result = await handlers.createNote('update-note', {
        content: 'New content',
      });

      expect(result).toEqual({ success: true });

      const note = await db.getNote('update-note');
      expect(note?.content).toBe('New content');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const errorDb: NoteDatabase = {
        async getNote() {
          throw new Error('Database connection failed');
        },
        async getNoteMetadata() {
          throw new Error('Database connection failed');
        },
        async upsertNote() {
          throw new Error('Database connection failed');
        },
        async deleteNote() {
          throw new Error('Database connection failed');
        },
        async deleteExpiredNotes() {
          throw new Error('Database connection failed');
        },
      };

      const errorHandlers = createAPIHandlers({ db: errorDb, logger });

      const result = await errorHandlers.getNote('any-note');

      expect(result).toEqual({
        error: 'Server error',
        status: 500,
      });
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
    });
  });
});
