# SecurePad

A secure, zero-knowledge, real-time sync notepad.

## Security Architecture

SecurePad uses a zero-knowledge architecture. The server never sees your encryption key.

### Key Derivation (HKDF)
We use **HKDF (HMAC-based Key Derivation Function)** to cryptographically separate the Note ID (public) from the Encryption Key (private) using the Title as the master secret.

1.  **Master Secret**: Derived from the Note Title.
2.  **Note ID**: `HKDF(Master, salt="SecurePad", info="ID")`
    *   This is sent to the server to identify the note.
    *   The server *cannot* derive the Key from this ID.
3.  **Encryption Key**: `HKDF(Master, salt="SecurePad", info="KEY")`
    *   This stays in your browser.
    *   Used to encrypt/decrypt content (AES-256-GCM).

This ensures that even if the server is compromised, your notes remain encrypted and unreadable.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket, SQLite (node:sqlite)
- **Shared**: TypeScript library for crypto logic

## Development

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Start Development Server**:
    ```bash
    pnpm dev
    ```
    - Client: http://localhost:5173
    - Server: http://localhost:3000

## Build

```bash
pnpm build
```
