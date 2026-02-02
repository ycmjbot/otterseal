# 🦦 @otterseal/core

Zero-knowledge cryptography library for OtterSeal. Provides secure encryption, decryption, and key derivation using industry-standard algorithms.

## Features

- **AES-256-GCM Encryption**: Authenticated encryption with associated data
- **HKDF Key Derivation**: Cryptographically secure key generation from titles
- **Zero Knowledge**: Keys never leave the browser/client
- **Type Safe**: Full TypeScript support with strict types

## Installation

```bash
npm install @otterseal/core
```

## Usage

### Derive an Encryption Key from a Title

```typescript
import { deriveKey } from '@otterseal/core';

const title = 'My Secret Note';
const encryptionKey = await deriveKey(title);
```

### Hash a Title to Get a Note ID

```typescript
import { hashTitle } from '@otterseal/core';

const title = 'My Secret Note';
const noteId = await hashTitle(title);
// Note ID is safe to send to the server (cannot derive key from it)
```

### Encrypt Content

```typescript
import { encryptNote } from '@otterseal/core';

const content = 'This is my secret message';
const key = await deriveKey('My Secret Note');
const encrypted = await encryptNote(content, key);
// `encrypted` is now a base64 string safe to store/transmit
```

### Decrypt Content

```typescript
import { decryptNote } from '@otterseal/core';

const encryptedContent = '...'; // from server
const key = await deriveKey('My Secret Note');
const plaintext = await decryptNote(encryptedContent, key);
console.log(plaintext); // 'This is my secret message'
```

## Security Architecture

### Key Derivation

OtterSeal uses **HKDF (HMAC-based Key Derivation Function)** to cryptographically separate the database ID from the encryption key:

1. **Master Secret**: `HKDF-Extract(Title)` — The raw secret derived from the user's title
2. **Note ID (Public)**: `HKDF-Expand(Master, info="ID", salt="SecurePad")`
   - Sent to the server for database lookups
   - **Cannot** be used to derive the encryption key
3. **Encryption Key (Private)**: `HKDF-Expand(Master, info="KEY", salt="SecurePad")`
   - Never leaves the client
   - Used for AES-256-GCM encryption

### Encryption

All content is encrypted using **AES-256-GCM**:
- **Mode**: Galois/Counter Mode (authenticated encryption)
- **Key Size**: 256 bits
- **Authentication**: GCM provides built-in authentication (AEAD)
- **Tamper Detection**: Any modification to ciphertext is detected and rejected

## API Reference

### `hashTitle(title: string): Promise<string>`

Derives a public ID from a title. Safe to send to the server.

**Parameters:**
- `title` — The note title

**Returns:** Promise resolving to a base64-encoded note ID

### `deriveKey(title: string): Promise<Uint8Array>`

Derives the encryption key from a title. Never sent to the server.

**Parameters:**
- `title` — The note title

**Returns:** Promise resolving to a 32-byte (256-bit) encryption key

### `encryptNote(content: string, key: Uint8Array): Promise<string>`

Encrypts content using AES-256-GCM.

**Parameters:**
- `content` — Plaintext to encrypt
- `key` — Encryption key (from `deriveKey()`)

**Returns:** Promise resolving to base64-encoded ciphertext

### `decryptNote(encrypted: string, key: Uint8Array): Promise<string>`

Decrypts AES-256-GCM ciphertext.

**Parameters:**
- `encrypted` — Base64-encoded ciphertext (from `encryptNote()`)
- `key` — Encryption key (must match the key used for encryption)

**Returns:** Promise resolving to plaintext, or throws if decryption fails

## Error Handling

Decryption will throw an error if:
- The ciphertext is invalid or corrupted
- The key is incorrect
- The ciphertext has been tampered with

Example:

```typescript
import { decryptNote } from '@otterseal/core';

try {
  const plaintext = await decryptNote(corrupted, key);
} catch (err) {
  console.error('Decryption failed:', err.message);
  // Handle error (e.g., show "Note corrupted or wrong password" to user)
}
```

## Browser Compatibility

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Node.js 20+
- Uses the Web Crypto API (`SubtleCrypto`)

## License

MIT
