import fs from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
  createAPIHandlers,
  type Note,
  type NoteDatabase,
  type NoteMetadata,
  type WSClient,
  WSManager,
  type WSUpdateMessage,
} from '@otterseal/rest-api';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { WebSocket, WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug logging
const logFile = process.env.NODE_ENV === 'production' ? '/app/data/debug.log' : 'debug.log';
function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try {
    fs.appendFileSync(logFile, line);
  } catch (_e) {}
}

log(`Starting server... Node version: ${process.version}`);

const app = express();
app.use(cors());
app.use(express.json());

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Referrer-Policy', 'no-referrer');
  // No-cache for /send/ routes
  if (req.path.startsWith('/send/') || req.path.startsWith('/api/send')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
});

// Database Setup
const dbPath =
  process.env.NODE_ENV === 'production' ? '/app/data/database.sqlite' : 'database.sqlite';

let sqliteDb: DatabaseSync;
try {
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT,
      expires_at INTEGER,
      burn_after_reading INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  log('Database initialized successfully');
} catch (e) {
  const err = e instanceof Error ? e : new Error(String(e));
  log(`Database initialization failed: ${err.message}\n${err.stack}`);
  process.exit(1);
}

// Implement NoteDatabase interface for SQLite
const db: NoteDatabase = {
  async getNote(id: string) {
    const stmt = sqliteDb.prepare(
      'SELECT content, expires_at, burn_after_reading, created_at, updated_at FROM notes WHERE id = ?',
    );
    return stmt.get(id) as unknown as Note | undefined;
  },

  async getNoteMetadata(id: string) {
    const stmt = sqliteDb.prepare(
      'SELECT expires_at, burn_after_reading, created_at, updated_at FROM notes WHERE id = ?',
    );
    return stmt.get(id) as unknown as NoteMetadata | undefined;
  },

  async upsertNote(id, content, expiresAt, burnAfterReading, createdAt, updatedAt) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO notes (id, content, expires_at, burn_after_reading, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        content = excluded.content, 
        expires_at = excluded.expires_at, 
        burn_after_reading = excluded.burn_after_reading, 
        updated_at = excluded.updated_at
    `);
    stmt.run(id, content, expiresAt, burnAfterReading ? 1 : 0, createdAt, updatedAt);
  },

  async deleteNote(id: string) {
    const stmt = sqliteDb.prepare('DELETE FROM notes WHERE id = ?');
    stmt.run(id);
  },

  async deleteExpiredNotes() {
    const stmt = sqliteDb.prepare(
      'DELETE FROM notes WHERE expires_at IS NOT NULL AND expires_at < ?',
    );
    const result = stmt.run(Date.now()) as { changes: number };
    return result.changes;
  },
};

// Create API handlers
const apiHandlers = createAPIHandlers({ db, logger: log });

// Create WebSocket manager
const wsManager = new WSManager({ db, logger: log });

// Cleanup expired notes every minute
setInterval(() => {
  wsManager.cleanupExpiredNotes().catch(e => {
    const err = e instanceof Error ? e : new Error(String(e));
    log(`Cleanup error: ${err.message}`);
  });
}, 60 * 1000);

// REST API endpoints
app.get('/api/notes/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const peek = req.query.peek === '1';

  const result = await apiHandlers.getNote(id, peek);

  if ('status' in result) {
    res.status(result.status).json(result);
  } else {
    res.json(result);
  }
});

app.post('/api/notes/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const result = await apiHandlers.createNote(id, req.body);
  if (result.status === undefined) {
    res.json(result);
    return;
  }

  res.status(result.status).json(result);
});

app.use(express.static(path.join(__dirname, 'public')));

const server = createServer(app);
const wss = new WebSocketServer({ server });

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
}

// Adapter to convert ws library to WSClient interface
function createWSClientAdapter(ws: ExtendedWebSocket): WSClient {
  return {
    send(message) {
      ws.send(JSON.stringify(message));
    },
    close() {
      ws.close();
    },
    isOpen() {
      return ws.readyState === WebSocket.OPEN;
    },
  };
}

wss.on('connection', async (ws: ExtendedWebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const id = url.searchParams.get('id');

  if (!id) {
    ws.close(1008, 'Invalid ID');
    return;
  }

  ws.roomId = id;
  const client = createWSClientAdapter(ws);

  await wsManager.onClientConnect(id, client);

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        await wsManager.onClientMessage(id, client, data as WSUpdateMessage);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      log(`WS parse error: ${err.message}`);
    }
  });

  ws.on('close', () => {
    wsManager.onClientDisconnect(id, client);
  });
});

app.get('/{*any}', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
