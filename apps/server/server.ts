import express, { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { DatabaseSync } from 'node:sqlite';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug logging
const logFile = process.env.NODE_ENV === 'production' ? '/app/data/debug.log' : 'debug.log';
function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try { fs.appendFileSync(logFile, line); } catch (e) {}
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

// Limits
const MAX_ID_LENGTH = 64; // SHA-256 hex length
const MAX_CONTENT_LENGTH = 100 * 1024; // 100KB

// Database Setup
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/app/data/database.sqlite' 
  : 'database.sqlite';

let db: any;
try {
  // Ensure directory exists if needed or just rely on volume mapping
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT
    )
  `);
  
  // Migration: Add expires_at and burn_after_reading columns if they don't exist
  try {
    db.exec(`ALTER TABLE notes ADD COLUMN expires_at INTEGER`);
    log('Added expires_at column');
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE notes ADD COLUMN burn_after_reading INTEGER DEFAULT 0`);
    log('Added burn_after_reading column');
  } catch (e) {}
  
  log('Database initialized successfully');
} catch (e: any) {
  log(`Database initialization failed: ${e.message}\n${e.stack}`);
  process.exit(1);
}

const getNote = db.prepare('SELECT content, expires_at, burn_after_reading FROM notes WHERE id = ?');
const getNoteMetadata = db.prepare('SELECT expires_at, burn_after_reading FROM notes WHERE id = ?');
const upsertNote = db.prepare(`
  INSERT INTO notes (id, content, expires_at, burn_after_reading) VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET content = excluded.content, expires_at = excluded.expires_at, burn_after_reading = excluded.burn_after_reading
`);
const deleteNote = db.prepare('DELETE FROM notes WHERE id = ?');
const deleteExpiredNotes = db.prepare('DELETE FROM notes WHERE expires_at IS NOT NULL AND expires_at < ?');

// Types
interface Note {
  content: string;
  expires_at: number | null;
  burn_after_reading: number;
}

interface NoteMetadata {
  expires_at: number | null;
  burn_after_reading: number;
}

// Cleanup expired notes every minute
setInterval(() => {
  try {
    const result = deleteExpiredNotes.run(Date.now());
    if ((result as any).changes > 0) {
      log(`Cleaned up ${(result as any).changes} expired notes`);
    }
  } catch (e: any) {
    log(`Cleanup error: ${e.message}`);
  }
}, 60 * 1000);

// Helper: Check if note is expired
function isExpired(note: NoteMetadata) {
  return note.expires_at && note.expires_at < Date.now();
}

// REST API for Send feature
app.get('/api/notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const peek = req.query.peek === '1';
  
  if (!id || id.length > MAX_ID_LENGTH) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  
  try {
    if (peek) {
      const note = getNoteMetadata.get(id) as NoteMetadata | undefined;
      if (!note) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (isExpired(note)) {
        deleteNote.run(id);
        return res.status(410).json({ error: 'Expired' });
      }
      return res.json({
        exists: true,
        expiresAt: note.expires_at,
        burnAfterReading: note.burn_after_reading === 1
      });
    } else {
      const note = getNote.get(id) as Note | undefined;
      if (!note) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (isExpired(note)) {
        deleteNote.run(id);
        return res.status(410).json({ error: 'Expired' });
      }
      
      const response = {
        content: note.content,
        expiresAt: note.expires_at,
        burnAfterReading: note.burn_after_reading === 1
      };
      
      if (note.burn_after_reading === 1) {
        deleteNote.run(id);
        log(`Burned note ${id.slice(0, 8)}...`);
      }
      
      return res.json(response);
    }
  } catch (e: any) {
    log(`API error: ${e.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, expiresAt, burnAfterReading } = req.body;
  
  if (!id || id.length > MAX_ID_LENGTH) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content required' });
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({ error: 'Content too large (max 100KB)' });
  }
  
  try {
    upsertNote.run(
      id,
      content,
      expiresAt || null,
      burnAfterReading ? 1 : 0
    );
    return res.json({ success: true });
  } catch (e: any) {
    log(`API error: ${e.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const server = createServer(app);
const wss = new WebSocketServer({ server });

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
}

const rooms = new Map<string, Set<ExtendedWebSocket>>();

function broadcast(id: string, sender: ExtendedWebSocket, data: any) {
  const room = rooms.get(id);
  if (room) {
    room.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

wss.on('connection', (ws: ExtendedWebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const id = url.searchParams.get('id');

  if (!id || id.length > MAX_ID_LENGTH) {
    ws.close(1008, 'Invalid ID');
    return;
  }

  ws.roomId = id;
  if (!rooms.has(id)) {
    rooms.set(id, new Set());
  }
  rooms.get(id)?.add(ws);

  console.log(`Client connected to room ${id}`);

  const note = getNote.get(id) as Note | undefined;
  if (note && !isExpired(note)) {
    ws.send(JSON.stringify({ type: 'init', content: note.content }));
  } else {
    if (note && isExpired(note)) {
      deleteNote.run(id);
    }
    ws.send(JSON.stringify({ type: 'init', content: '' }));
  }

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        if (!data.content || typeof data.content !== 'string') return;
        
        if (data.content.length > MAX_CONTENT_LENGTH) {
          ws.send(JSON.stringify({ type: 'error', message: 'Note too large (max 100KB)' }));
          return;
        }

        const existing = getNoteMetadata.get(id) as NoteMetadata | undefined;
        upsertNote.run(
          id,
          data.content,
          existing?.expires_at || null,
          existing?.burn_after_reading || 0
        );
        
        broadcast(id, ws, { type: 'update', content: data.content });
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    const room = rooms.get(id);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        rooms.delete(id);
      }
    }
  });
});

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
