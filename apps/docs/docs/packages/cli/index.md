# @otterseal/cli

**Command-line tool** for creating zero-knowledge encrypted notes and secret links.

## Features

- 📝 **Notes** — Create, read, edit encrypted notes
- 🔗 **Secret Links** — Share one-time secrets with expiration
- ⏱️ **Expiration** — Auto-delete after time or reading
- 🔐 **Zero Knowledge** — Server cannot read your content
- ⚙️ **Config** — Custom server & editor

## Installation

```bash
npm install -g @otterseal/cli
# or
pnpm add -g @otterseal/cli
```

Then use:

```bash
oseal --help
otterseal --help
```

## Quick Start

### Create a Secret

```bash
oseal secret send "This is a secret message"
# Output: https://otterseal.ycmj.bot/send/abc123#key
```

### Share a Secret with Expiration

```bash
# 30 minutes
oseal secret send "Secret" --expires 30m

# 1 day
oseal secret send "Secret" --expires 1d

# Self-destruct after reading
oseal secret send "Secret" --self-destruct
```

### Manage Notes

```bash
# Create/edit a note
oseal note edit "my-note-title" "Hello, world!"

# Read a note
oseal note read "my-note-title"

# From stdin
echo "Content" | oseal note edit "my-note"
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

All encryption happens locally using `@otterseal/core`:

1. **Title** → HKDF derivation → Note ID (sent to server)
2. **Title** → HKDF derivation → AES-256 key
3. **Content** → AES-256-GCM encrypted → stored on server

The server never sees your plaintext or keys.

## Learn More

- [Installation Guide](/packages/core/installation) — Setup instructions
- [GitHub Repository](https://github.com/ycmjbot/otterseal)


