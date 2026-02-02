# @otterseal/core

**Zero-knowledge cryptography library** for client-side encryption in browsers and Node.js.

## Features

- 🔐 **AES-256-GCM** — Authenticated encryption
- 🔑 **HKDF** — Secure key derivation with domain separation
- 🔒 **Zero Knowledge** — Keys never leave the client
- 📝 **TypeScript** — Fully typed, production-ready

## Installation

```bash
npm install @otterseal/core
# or
pnpm add @otterseal/core
```

## Quick Start

```typescript
import { deriveKey, encryptNote, decryptNote } from '@otterseal/core'

// Derive encryption key from title
const title = 'My Secret Note'
const key = await deriveKey(title)

// Encrypt
const encrypted = await encryptNote('This is secret', key)
console.log(encrypted) // base64-encoded ciphertext

// Decrypt
const plaintext = await decryptNote(encrypted, key)
console.log(plaintext) // 'This is secret'
```

## How It Works

OtterSeal uses **HKDF (HMAC-based Key Derivation Function)** to create two derived values from a single title:

### 1. Note ID (Public)
```typescript
import { hashTitle } from '@otterseal/core'

const noteId = await hashTitle('My Secret Note')
// Safe to send to server
// Cannot be used to decrypt content
```

### 2. Encryption Key (Private)
```typescript
import { deriveKey } from '@otterseal/core'

const encKey = await deriveKey('My Secret Note')
// Never sent to server
// Used for AES-256-GCM encryption
```

## Why This Design?

The **HKDF domain separation** ensures that even if the server knows your note ID, it **cannot** derive your encryption key:

| Value | Derivation | Public? | Use |
|-------|-----------|---------|-----|
| Note ID | `HKDF(title, info="ID")` | ✅ Yes | Server database lookup |
| Encryption Key | `HKDF(title, info="KEY")` | ❌ No | Client-side encryption |

This is the foundation of zero-knowledge architecture: **the server stores encrypted data it cannot decrypt**.

## Browser Support

- ✅ Chrome 37+
- ✅ Firefox 34+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Node.js 15+

All via the standard Web Crypto API (`SubtleCrypto`).

## Learn More

- [API Reference](/packages/core/api) — Detailed function documentation
- [Installation Guide](/packages/core/installation) — Setup instructions

