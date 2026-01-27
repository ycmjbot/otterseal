# Public Encrypted Notepad

A zero-knowledge, real-time sync notepad.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js (Express + WebSocket), SQLite (node:sqlite)
- **Encryption**: Client-side AES-256-GCM (Web Crypto API)

## Setup & Run

1. **Install Dependencies**
   ```bash
   npm run install:all
   ```
   (Or install manually in `root`, `server/`, and `client/`)

2. **Start Application**
   ```bash
   npm start
   ```
   This starts:
   - Server on `http://localhost:3000`
   - Client on `http://localhost:5173`

3. **Open Browser**
   Go to `http://localhost:5173`.
   Enter a title (e.g., "secret-plan") and click "Open Note".
   Share the URL (or just the title) with someone else to collaborate.

## Architecture
- **Zero-Knowledge**: Server stores only `SHA-256(Title)` as ID and `AES-256(Content, Key=Title)` as content. Server cannot decrypt notes.
- **Real-time**: WebSockets broadcast encrypted updates.
- **Persistence**: SQLite database with Write-Ahead Logging (WAL) via `better-sqlite3` compatible `node:sqlite`.
