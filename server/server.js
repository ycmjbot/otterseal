import express from 'express';
import { WebSocketServer } from 'ws';
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
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try { fs.appendFileSync(logFile, line); } catch (e) {}
}

log(`Starting server... Node version: ${process.version}`);

const app = express();
app.use(cors());
app.use(express.json());

// Limits
const MAX_ID_LENGTH = 64; // SHA-256 hex length
const MAX_CONTENT_LENGTH = 100 * 1024; // 100KB

// Database Setup
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/app/data/database.sqlite' 
  : 'database.sqlite';

let db;
try {
  // Ensure directory exists if needed or just rely on volume mapping
  db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      content TEXT
    )
  `);
  log('Database initialized successfully');
} catch (e) {
  log(`Database initialization failed: ${e.message}\n${e.stack}`);
  process.exit(1);
}

const getNote = db.prepare('SELECT content FROM notes WHERE id = ?');
const upsertNote = db.prepare(`
  INSERT INTO notes (id, content) VALUES (?, ?)
  ON CONFLICT(id) DO UPDATE SET content = excluded.content
`);

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, 'public')));

// HTTP Server & WS
const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map(); // Map<id, Set<ws>>

function broadcast(id, sender, data) {
  const room = rooms.get(id);
  if (room) {
    room.forEach(client => {
      if (client !== sender && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');

  if (!id || id.length > MAX_ID_LENGTH) {
    ws.close(1008, 'Invalid ID');
    return;
  }

  ws.roomId = id;
  if (!rooms.has(id)) {
    rooms.set(id, new Set());
  }
  rooms.get(id).add(ws);

  console.log(`Client connected to room ${id}`);

  // Send current state
  const note = getNote.get(id);
  if (note) {
    ws.send(JSON.stringify({ type: 'init', content: note.content }));
  } else {
    ws.send(JSON.stringify({ type: 'init', content: '' }));
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'update') {
        if (!data.content || typeof data.content !== 'string') return;
        
        if (data.content.length > MAX_CONTENT_LENGTH) {
          ws.send(JSON.stringify({ type: 'error', message: 'Note too large (max 100KB)' }));
          return;
        }

        // Persistence (Last-Writer-Wins)
        upsertNote.run(id, data.content);
        
        // Broadcast
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

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
