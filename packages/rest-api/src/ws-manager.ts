import type { NoteDatabase, WSMessage, WSUpdateMessage } from './types.js';

const MAX_ID_LENGTH = 64;
const MAX_CONTENT_LENGTH = 100 * 1024;

interface NoteMetadata {
  expires_at: number | null;
  burn_after_reading: number;
  created_at: number | null;
  updated_at: number | null;
}

function isExpired(note: NoteMetadata): boolean {
  return note.expires_at !== null && note.expires_at < Date.now();
}

/**
 * Generic WebSocket client interface
 * Implementers provide adapters for their WS library (ws, Socket.io, etc.)
 */
export interface WSClient {
  send(message: WSMessage): void;
  close(): void;
  isOpen(): boolean;
}

export interface WSManagerOptions {
  db: NoteDatabase;
  logger?: (msg: string) => void;
}

/**
 * Framework-agnostic WebSocket room manager
 * Handles note state, expiration, and message broadcasting
 */
export class WSManager {
  private rooms = new Map<string, Set<WSClient>>();
  private db: NoteDatabase;
  private logger: (msg: string) => void;

  constructor(options: WSManagerOptions) {
    this.db = options.db;
    this.logger = options.logger || (() => {});
  }

  /**
   * Handle new client connection to a room
   */
  async onClientConnect(roomId: string, client: WSClient): Promise<void> {
    if (!roomId || roomId.length > MAX_ID_LENGTH) {
      client.send({ type: 'error', message: 'Invalid ID' });
      client.close();
      return;
    }

    // Add client to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)?.add(client);

    // Send initial note content
    try {
      const note = await this.db.getNote(roomId);
      if (note && !isExpired({ ...note })) {
        client.send({ type: 'init', content: note.content });
      } else {
        if (note && isExpired({ ...note })) {
          await this.db.deleteNote(roomId);
        }
        client.send({ type: 'init', content: '' });
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      this.logger(`WS init error: ${err.message}`);
      client.send({ type: 'error', message: 'Failed to load note' });
    }

    this.logger(`Client connected to room ${roomId}`);
  }

  /**
   * Handle client disconnect
   */
  onClientDisconnect(roomId: string, client: WSClient): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(client);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Handle incoming message from client
   */
  async onClientMessage(roomId: string, sender: WSClient, message: WSUpdateMessage): Promise<void> {
    try {
      const { content } = message;

      if (!content || typeof content !== 'string') {
        return;
      }

      if (content.length > MAX_CONTENT_LENGTH) {
        sender.send({ type: 'error', message: 'Note too large (max 100KB)' });
        return;
      }

      // Get existing note metadata
      const existing = await this.db.getNoteMetadata(roomId);
      const now = Date.now();

      await this.db.upsertNote(
        roomId,
        content,
        existing?.expires_at || null,
        (existing?.burn_after_reading || 0) === 1,
        existing?.created_at || now,
        now,
      );

      // Broadcast to other clients
      this.broadcast(roomId, sender, { type: 'update', content });
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      this.logger(`WS message error: ${err.message}`);
    }
  }

  /**
   * Broadcast message to all clients in room except sender
   */
  private broadcast(roomId: string, sender: WSClient, data: WSMessage): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach(client => {
        if (client !== sender && client.isOpen()) {
          try {
            client.send(data);
          } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            this.logger(`Broadcast error: ${err.message}`);
          }
        }
      });
    }
  }

  /**
   * Cleanup expired notes (call periodically)
   */
  async cleanupExpiredNotes(): Promise<void> {
    try {
      const count = await this.db.deleteExpiredNotes();
      if (count > 0) {
        this.logger(`Cleaned up ${count} expired notes`);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      this.logger(`Cleanup error: ${err.message}`);
    }
  }
}
