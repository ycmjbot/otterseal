# 🦦 OtterSeal

A secure, zero-knowledge, real-time sync notepad. Write notes that are encrypted in your browser before they ever reach the server. Share them with a link, or send self-destructing secrets.

## Features

- **Zero-Knowledge Encryption**: Your notes are encrypted with AES-256-GCM using a key derived from the title. The server never sees the key.
- **Real-Time Sync**: Collaborate on notes in real-time across multiple devices using WebSockets.
- **Send Secrets**: Create one-time links that self-destruct after reading (or after a set time).
- **Offline Capable**: Works even if you disconnect briefly.
- **Markdown Support**: Rich text editing with Markdown shortcuts.
- **Dark Mode**: Automatically respects your system preference or toggle manually.

## Security Architecture

OtterSeal uses **HKDF (HMAC-based Key Derivation Function)** to cryptographically separate the database ID from the encryption key.

1.  **Master Secret**: `HKDF-Extract(Title)`
2.  **Note ID (Public)**: `HKDF-Expand(Master, info="ID", salt="OtterSeal")`
    *   Sent to the server as the database lookup key.
    *   The server *cannot* derive the encryption key from this ID.
3.  **Encryption Key (Private)**: `HKDF-Expand(Master, info="KEY", salt="OtterSeal")`
    *   Kept in the browser (never sent to server).
    *   Used to encrypt content via **AES-256-GCM**.

This ensures that even if the server database is compromised, an attacker (or the server admin) cannot decrypt any notes without guessing the exact title.

## Project Structure

This is a **pnpm monorepo** containing:

- `apps/client`: React frontend (Vite + TypeScript + Tailwind)
- `apps/server`: Node.js backend (Express + WebSocket + SQLite)
- `packages/core`: Shared crypto logic (TypeScript)
- `apps/cli`: Command-line interface for notes and secrets

## CLI Usage

Install globally:
```bash
npm install -g @otterseal/cli
```

### Note Commands
```bash
oseal note read <title>           # Read a note
oseal note edit <title> [content] # Create/edit a note (opens $EDITOR if no content)
```

### Secret Commands
```bash
oseal secret send [content]           # Create a one-time secret
  --expires <duration>               # "1h", "30m", "7d" (default: 24h)
  --self-destruct                    # Burn after first read
  --editor                           # Force open $EDITOR

oseal secret reveal <url>            # Reveal and decrypt a secret
oseal secret peek <url>              # Check if secret exists (don't read)
```

### Configuration
Create `~/.oseal.json`:
```json
{
  "server_url": "https://otterseal.ycmj.bot",
  "editor": "vim"
}
```

## Development

### Prerequisites
- Node.js v24+
- pnpm

### Setup

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Start Development Server**:
    ```bash
    pnpm dev
    ```
    This starts both the client and server concurrently.
    - Client: http://localhost:5173
    - Server: http://localhost:3000

### Build

To build all packages for production:

```bash
pnpm build
```

### Deployment

The app is deployed via **Otterway** (Podman + Caddy).

1.  Build the image:
    ```bash
    pnpm build
    podman build -t otterseal .
    ```
2.  The `app.otterway.json` handles the container configuration.

## License

MIT
