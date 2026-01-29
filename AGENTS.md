# AGENTS.md — Securepad

Zero-knowledge encrypted notepad with real-time collaboration.

## Overview

- **Live:** https://securepad.jbot.ycmjason.com
- **Repo:** https://github.com/ycmjbot/securepad
- **Stack:** Node.js, Express, WebSocket, SQLite, React, Vite, Tailwind

## Architecture

```
securepad/
├── apps/
│   ├── client/          # React frontend (Vite)
│   ├── server/          # Express + WebSocket backend
│   └── cli/             # Command-line interface
├── packages/
│   └── shared/          # Crypto functions (used by all apps)
├── data/                # SQLite database (gitignored, volume-mounted)
├── Containerfile        # Production container build
└── app.otterway.json    # Deployment config
```

## Zero-Knowledge Encryption

All encryption is **client-side**. Server never sees plaintext.

```
Title → SHA-256 hash → Note ID (stored on server)
Title → SHA-256 → AES-256-GCM key derivation
Content → Encrypt with key → Ciphertext (stored on server)
```

**Key files:**
- `packages/shared/src/index.js` — `hashTitle()`, `deriveKey()`, `encryptNote()`, `decryptNote()`

## Server API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notes/:id` | GET | Fetch note (add `?peek=1` for metadata only) |
| `/api/notes/:id` | POST | Create/update note |
| WebSocket `?id=...` | — | Real-time sync for collaborative editing |

**POST body:**
```json
{
  "content": "<encrypted JSON string>",
  "expiresAt": 1706000000000,      // optional, unix ms
  "burnAfterReading": true         // optional
}
```

**GET response:**
```json
{
  "content": "<encrypted>",
  "expiresAt": 1706000000000,
  "burnAfterReading": true
}
```

## CLI (`apps/cli/`)

```bash
# Run from monorepo root
node apps/cli/bin/securepad.js <command>

# Commands
read <title>              # Decrypt and print note
write <title> [content]   # Encrypt and save (stdin supported)
send [content]            # Create one-time secret link
receive <url>             # Fetch one-time secret
delete <title>            # Delete note
```

**Options:** `--expires <duration>`, `--burn`, `--no-burn`, `--peek`

## Client Features

- **Main notepad:** Title-based notes with real-time WebSocket sync
- **Send mode:** One-time secrets with burn-after-reading (`/send/:id#key`)
- **Starred notes:** Local storage only (client-side)
- **Themes:** Light/dark mode

**Key client files:**
- `apps/client/src/` — React app
- `apps/client/src/hooks/` — `useStarredNotes.js`, `useTheme.js`

## Development

```bash
# Install deps
pnpm install

# Dev mode (runs client + server)
pnpm dev

# Build client for production
pnpm build

# Server only
pnpm --filter server start
```

## Deployment

Deployed via **Otterway** (Podman + Quadlet + Caddy).

```bash
# From server
otterway sync securepad
```

- Container runs on port 3000
- Caddy reverse proxies from `securepad.jbot.ycmjason.com`
- SQLite database persisted in `./data/` (volume mount)

## Database

SQLite with WAL mode. Schema:

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,           -- SHA-256 hash of title
  content TEXT,                  -- Encrypted JSON
  expires_at INTEGER,            -- Unix timestamp (ms), nullable
  burn_after_reading INTEGER     -- 0 or 1
);
```

Expired notes are cleaned up every 60 seconds.

## Common Tasks

**Add a new API endpoint:** Edit `apps/server/server.js`

**Change crypto:** Edit `packages/shared/src/index.js` (affects all apps)

**Add CLI command:** Edit `apps/cli/bin/securepad.js`

**Update client UI:** Edit `apps/client/src/`

**Rebuild & deploy:**
```bash
cd ~/apps/securepad
pnpm build
otterway sync securepad
```
