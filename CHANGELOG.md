# OtterSeal Changelog

All notable changes to the OtterSeal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-02-02

### Added
- 🦦 Initial release of OtterSeal - Zero-knowledge encrypted notes and secrets
- **CLI Interface** (`oseal` / `otterseal` commands):
  - `oseal note read <id>` - Read encrypted notes from the web UI
  - `oseal note edit [id]` - Create or edit encrypted notes
  - `oseal secret send` - Create one-time secrets (burn-after-read)
  - `oseal secret reveal <id>` - Reveal secrets from the CLI or web
  - `oseal secret peek <id>` - Check if a secret exists without revealing
  - Global flags: `--server`, `--api`, `--config` for configuration
- **`@otterseal/core`** - Shared cryptography library:
  - AES-256-GCM authenticated encryption
  - HKDF for cryptographically secure key derivation
  - URL-safe base64 encoding for IDs and keys
  - Zero-knowledge architecture - server never sees encryption keys
- **Web UI** - React-based zero-knowledge encrypted notepad:
  - Real-time collaborative editing via WebSocket
  - Lexical rich text editor with markdown support
  - Auto-save with debouncing
  - Responsive design with Tailwind CSS
- **Server API** - Express + WebSocket backend:
  - Real-time document synchronization
  - Secret storage with expiration
  - CORS-enabled for cross-origin requests
- **Configuration** - JSON-based config via `~/.oseal.json`
- **Development tooling**:
  - Biome for linting and formatting
  - Lefthook for Git hooks
  - tsgo for fast TypeScript builds
  - pkgroll for package bundling
  - pnpm workspaces for monorepo management

### Security
- Zero-knowledge architecture - encryption keys never leave the client
- HKDF key derivation cryptographically separates document IDs from encryption keys
- AES-256-GCM provides authenticated encryption (confidentiality + integrity)
- Self-destructing secrets with burn-after-read semantics
- Configurable expiration for notes and secrets
- No server-side storage of decryption keys

### Documentation
- Comprehensive README with quickstart guide
- CLI usage documentation (`oseal --help`)
- Security architecture documentation
- Code standards and contributor guidelines (AGENTS.md)
- Troubleshooting guide (TROUBLESHOOTING.md)

[0.0.1]: https://github.com/ycmjbot/otterseal/releases/tag/v1.0.0
