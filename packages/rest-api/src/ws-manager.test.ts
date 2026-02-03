import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { NoteDatabase, WSClient } from './types.ts';
import { WSManager } from './ws-manager.ts';

/**
 * Mock database for testing
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

/**
 * Mock WebSocket client for testing
 */
class MockWSClient implements WSClient {
  public messages: unknown[] = [];
  public closed = false;

  send(message: unknown): void {
    this.messages.push(message);
  }

  close(): void {
    this.closed = true;
  }

  isOpen(): boolean {
    return !this.closed;
  }
}

describe('WSManager', () => {
  let db: MockDatabase;
  let manager: WSManager;
  let logger: Mock<(msg: string) => void>;

  beforeEach(() => {
    db = new MockDatabase();
    logger = vi.fn();
    manager = new WSManager({ db, logger });
  });

  describe('client connection', () => {
    it('should send initial note content on connect', async () => {
      const now = Date.now();
      await db.upsertNote('room1', 'Hello', null, false, now, now);

      const client = new MockWSClient();
      await manager.onClientConnect('room1', client);

      expect(client.messages).toContainEqual({
        type: 'init',
        content: 'Hello',
      });
    });

    it('should send empty content if note does not exist', async () => {
      const client = new MockWSClient();
      await manager.onClientConnect('room1', client);

      expect(client.messages).toContainEqual({
        type: 'init',
        content: '',
      });
    });

    it('should reject invalid room IDs', async () => {
      const client = new MockWSClient();
      await manager.onClientConnect('', client);

      expect(client.messages).toContainEqual({
        type: 'error',
        message: 'Invalid ID',
      });
      expect(client.closed).toBe(true);
    });

    it('should reject room IDs that are too long', async () => {
      const tooLongId = 'a'.repeat(100);
      const client = new MockWSClient();
      await manager.onClientConnect(tooLongId, client);

      expect(client.messages).toContainEqual({
        type: 'error',
        message: 'Invalid ID',
      });
      expect(client.closed).toBe(true);
    });

    it('should handle expired notes on connect', async () => {
      const pastTime = Date.now() - 60000;
      const now = Date.now();
      await db.upsertNote('expired-room', 'Old', pastTime, false, now, now);

      const client = new MockWSClient();
      await manager.onClientConnect('expired-room', client);

      expect(client.messages).toContainEqual({
        type: 'init',
        content: '',
      });

      // Note should be deleted
      const note = await db.getNote('expired-room');
      expect(note).toBeUndefined();
    });
  });

  describe('message handling', () => {
    it('should update note content', async () => {
      const now = Date.now();
      await db.upsertNote('room1', 'Initial', null, false, now, now);

      const client1 = new MockWSClient();
      const client2 = new MockWSClient();
      await manager.onClientConnect('room1', client1);
      await manager.onClientConnect('room1', client2);

      // Clear the init messages
      client1.messages = [];
      client2.messages = [];

      // Send update from client1
      await manager.onClientMessage('room1', client1, {
        type: 'update',
        content: 'Updated content',
      });

      // Client2 should receive the broadcast
      expect(client2.messages).toContainEqual({
        type: 'update',
        content: 'Updated content',
      });

      // Client1 should not receive its own message
      expect(client1.messages).toEqual([]);

      // Database should be updated
      const note = await db.getNote('room1');
      expect(note?.content).toBe('Updated content');
    });

    it('should reject empty content updates', async () => {
      const client = new MockWSClient();
      await manager.onClientConnect('room1', client);
      client.messages = [];

      // Try to send empty content - should be silently ignored
      await manager.onClientMessage('room1', client, {
        type: 'update',
        content: '',
      });

      expect(client.messages).toEqual([]);

      const note = await db.getNote('room1');
      expect(note).toBeUndefined();
    });

    it('should reject content that is too large', async () => {
      const client = new MockWSClient();
      await manager.onClientConnect('room1', client);
      client.messages = [];

      const tooLarge = 'x'.repeat(101 * 1024);

      await manager.onClientMessage('room1', client, {
        type: 'update',
        content: tooLarge,
      });

      expect(client.messages).toContainEqual({
        type: 'error',
        message: 'Note too large (max 100KB)',
      });

      const note = await db.getNote('room1');
      expect(note).toBeUndefined();
    });

    it('should preserve existing note metadata when updating', async () => {
      const futureTime = Date.now() + 3600000;
      const now = Date.now();
      await db.upsertNote('room1', 'Original', futureTime, true, now, now);

      const client = new MockWSClient();
      await manager.onClientConnect('room1', client);

      await manager.onClientMessage('room1', client, {
        type: 'update',
        content: 'New content',
      });

      const note = await db.getNote('room1');
      expect(note?.content).toBe('New content');
      expect(note?.expires_at).toBe(futureTime);
      expect(note?.burn_after_reading).toBe(1);
    });
  });

  describe('client disconnect', () => {
    it('should remove client from room', async () => {
      const client1 = new MockWSClient();
      const client2 = new MockWSClient();

      await manager.onClientConnect('room1', client1);
      await manager.onClientConnect('room1', client2);

      // Disconnect client1
      manager.onClientDisconnect('room1', client1);

      // Clear all messages from both clients
      client1.messages = [];
      client2.messages = [];

      // Send message from client2
      await manager.onClientMessage('room1', client2, {
        type: 'update',
        content: 'Update',
      });

      // Should not broadcast to disconnected client
      expect(client1.messages).toEqual([]);
      // Connected client should receive the update
      expect(client2.messages).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('should delete expired notes', async () => {
      const pastTime = Date.now() - 60000;
      const now = Date.now();

      await db.upsertNote('expired1', 'Old1', pastTime, false, now, now);
      await db.upsertNote('expired2', 'Old2', pastTime, false, now, now);
      await db.upsertNote('valid', 'Current', null, false, now, now);

      await manager.cleanupExpiredNotes();

      expect(await db.getNote('expired1')).toBeUndefined();
      expect(await db.getNote('expired2')).toBeUndefined();
      expect(await db.getNote('valid')).toBeDefined();
    });

    it('should log cleanup results', async () => {
      const pastTime = Date.now() - 60000;
      const now = Date.now();

      await db.upsertNote('expired', 'Old', pastTime, false, now, now);
      await manager.cleanupExpiredNotes();

      expect(logger).toHaveBeenCalledWith(expect.stringContaining('Cleaned up 1 expired notes'));
    });
  });
});
