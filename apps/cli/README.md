# @otterseal/cli

🦦 OtterSeal - Zero-knowledge encrypted secrets CLI

## Installation

```bash
# From the monorepo
pnpm install

# Or install globally (when published)
npm install -g @otterseal/cli
```

## Usage

### Note Commands

```bash
# Read a note
oseal note read "my-note-title"

# Create or edit a note (opens $EDITOR if no content)
oseal note edit "my-note-title" "Hello, world!"
echo "Hello, world!" | oseal note edit "my-note-title"
```

### Secret Commands

```bash
# Create a one-time secret link
oseal secret send "This is a secret message"

# With custom expiration
oseal secret send "Secret" --expires 30m
oseal secret send "Secret" --expires 1d
oseal secret send "Secret" --expires 7d

# Self-destruct after reading
oseal secret send "Secret" --self-destruct

# From stdin
echo "Secret content" | oseal secret send

# Reveal a secret
oseal secret reveal "https://otterseal.ycmj.bot/send/abc123#key"

# Check if secret exists without reading
oseal secret peek "https://otterseal.ycmj.bot/send/abc123#key"
```

## Configuration

Create `~/.oseal.json`:

```json
{
  "server_url": "https://otterseal.ycmj.bot",
  "editor": "vim"
}
```

## How It Works

All encryption happens client-side using AES-256-GCM:

1. **Note title** → HKDF derivation → note ID (server only sees this)
2. **Note title** → HKDF derivation → AES-256 key
3. **Content** → encrypted with derived key → stored on server

The server never sees your plaintext content or titles.
