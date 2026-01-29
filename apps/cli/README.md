# @securepad/cli

Zero-knowledge encrypted notepad CLI for [securepad](https://securepad.jbot.ycmjason.com).

## Installation

```bash
# From the monorepo
pnpm install

# Or install globally (when published)
npm install -g @securepad/cli
```

## Usage

### Read a note

```bash
securepad read "my-note-title"
securepad get "my-note-title" > output.txt
```

### Write a note

```bash
# Direct content
securepad write "my-note-title" "Hello, world!"

# From stdin
echo "Hello, world!" | securepad write "my-note-title"
cat file.txt | securepad write "my-note-title"

# With options
securepad write "my-note-title" "Secret" --expires 1h --burn
```

### Send a one-time secret

```bash
# Create a burn-after-reading secret link
securepad send "This is a secret message"

# With custom expiration
securepad send "Secret" --expires 30m
securepad send "Secret" --expires 1d

# Allow multiple reads
securepad send "Secret" --no-burn

# From stdin
echo "Secret content" | securepad send
```

### Receive a secret

```bash
# Fetch and decrypt
securepad receive "https://securepad.jbot.ycmjason.com/send/abc123#key"

# Check if it exists without triggering burn
securepad receive "https://..." --peek
```

### Delete a note

```bash
securepad delete "my-note-title"
securepad rm "my-note-title"
```

## Environment Variables

- `SECUREPAD_URL` - Override the server URL (default: `https://securepad.jbot.ycmjason.com`)

## How It Works

All encryption happens client-side using AES-256-GCM:

1. **Note title** → SHA-256 hash → note ID (server only sees this)
2. **Note title** → AES-256 key derivation
3. **Content** → encrypted with derived key → stored on server

The server never sees your plaintext content or titles.
