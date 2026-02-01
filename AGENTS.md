# AGENTS.md — OtterSeal

🦦 Zero-knowledge encrypted notepad with real-time collaboration.

## Overview

- **Live:** https://otterseal.ycmj.bot
- **Repo:** https://github.com/ycmjbot/otterseal
- **Stack:** Node.js, Express, WebSocket, SQLite, React, Vite, Tailwind
- **Language:** TypeScript (Client, Server, Core Package)
- **Versioning:** Semver (`1.0.0`)

## Architecture

```
otterseal/
├── apps/
│   ├── client/          # React frontend (Vite)
│   ├── server/          # Express + WebSocket backend
│   └── cli/             # Command-line interface
├── packages/
│   └── core/            # Crypto functions (used by all apps)
├── data/                # SQLite database (gitignored, volume-mounted)
├── Containerfile        # Production container build
└── app.otterway.json    # Deployment config
```

## Zero-Knowledge Encryption (Security Architecture)

We use **HKDF (Domain Separation)** to prevent the server from deriving the encryption key from the note ID.

**Old Flow (Insecure):** `ID = Hash(Title)`, `Key = Hash(Title)` → Server knew Key.
**New Flow (Secure):**
```
MasterSecret = HKDF_Extract(Title)

Note ID (Public)  = HKDF_Expand(MasterSecret, info="ID", salt="SecurePad")
Encryption Key    = HKDF_Expand(MasterSecret, info="KEY", salt="SecurePad")
```

- **Note ID:** Sent to server. Used as database primary key.
- **Encryption Key:** Kept in client. Used for AES-256-GCM.
- **Result:** The server knows the ID but cannot mathematically derive the Key.

**Key files:**
- `packages/core/src/index.ts` — `hashTitle()`, `deriveKey()`, `encryptNote()`, `decryptNote()`
- Constants: `HKDF_SALT="SecurePad"` (kept for backward compatibility), `HKDF_INFO_ID="ID"`, `HKDF_INFO_KEY="KEY"`

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
node apps/cli/bin/oseal.js <command>

# Commands
note read <title>              # Decrypt and print note
note edit <title> [content]    # Encrypt and save (stdin supported)
secret send [content]          # Create one-time secret link
secret reveal <url>            # Fetch one-time secret
secret peek <url>              # Check if secret exists
```

**Options:** `--expires <duration>`, `--self-destruct`, `--editor`, `--peek`

## Client Features

- **Main notepad:** Title-based notes with real-time WebSocket sync
- **Send mode:** One-time secrets with burn-after-reading (`/send/:id#key`)
- **Starred notes:** Local storage only (client-side)
- **Themes:** Light/dark mode

**Key client files:**
- `apps/client/src/` — React app (TypeScript)
- `apps/client/src/hooks/` — `useStarredNotes.ts`, `useTheme.ts`

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
otterway sync otterseal
```

- Container runs on port 3000
- Caddy reverse proxies from `otterseal.ycmj.bot`
- SQLite database persisted in `./data/` (volume mount)

## Database

SQLite with WAL mode. Schema:

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,           -- Derived via HKDF(Title, "ID")
  content TEXT,                  -- Encrypted JSON
  expires_at INTEGER,            -- Unix timestamp (ms), nullable
  burn_after_reading INTEGER     -- 0 or 1
);
```

Expired notes are cleaned up every 60 seconds.

## Common Tasks

**Add a new API endpoint:** Edit `apps/server/server.ts`

**Change crypto:** Edit `packages/core/src/index.ts` (affects all apps)

**Add CLI command:** Edit `apps/cli/bin/oseal.js`

**Update client UI:** Edit `apps/client/src/`

**Rebuild & deploy:**
```bash
cd ~/apps/otterseal
pnpm build
otterway sync otterseal
```
