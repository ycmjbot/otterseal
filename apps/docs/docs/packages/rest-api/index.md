# @otterseal/rest-api

**Backend API** for self-hosting OtterSeal. Includes REST endpoints and WebSocket support.

## Features

- 🌐 **REST API** — Store/retrieve encrypted notes
- 🔌 **WebSockets** — Real-time sync for collaborative editing
- 💾 **SQLite** — Built-in database (or bring your own)
- 🔐 **Zero Knowledge** — Server cannot decrypt content
- 📦 **Framework Agnostic** — Use with Express, Fastify, etc.

## Quick Start

### Installation

```bash
npm install @otterseal/rest-api
```

### Express Example

```typescript
import express from 'express'
import { createAPIHandlers } from '@otterseal/rest-api'
import { DatabaseSync } from 'node:sqlite'

const app = express()
app.use(express.json())

// Setup database
const db = new DatabaseSync(':memory:')
db.exec(`
  CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    content TEXT,
    expires_at INTEGER,
    burn_after_reading INTEGER DEFAULT 0,
    created_at INTEGER,
    updated_at INTEGER
  )
`)

// Create handlers
const handlers = createAPIHandlers({ db })

// Routes
app.get('/api/notes/:id', async (req, res) => {
  const result = await handlers.getNote(req.params.id)
  if ('status' in result) {
    res.status(result.status).json(result)
  } else {
    res.json(result)
  }
})

app.post('/api/notes/:id', async (req, res) => {
  const result = await handlers.createNote(req.params.id, req.body)
  if ('status' in result) {
    res.status(result.status).json(result)
  } else {
    res.json(result)
  }
})

app.listen(3000, () => {
  console.log('OtterSeal API running on http://localhost:3000')
})
```

## Architecture

```
Client
  ↓ (encrypted data)
REST API Endpoints
  ↓
Database (SQLite or custom)
  ↓ (encrypted data stored)
Server (cannot decrypt)
```

The API is **framework-agnostic**: implement the handlers in your framework of choice.

## Learn More

- [Installation](/packages/core/installation) — Setup guide
- [GitHub Repository](https://github.com/ycmjbot/otterseal)


