# API Reference

## `hashTitle(title: string): Promise<string>`

Derives a public note ID from a title. Safe to send to the server.

### Parameters

- **`title`** (`string`) — The note title

### Returns

A promise resolving to a 64-character hexadecimal string (256-bit hash).

### Example

```typescript
import { hashTitle } from '@otterseal/core'

const noteId = await hashTitle('My Secret Note')
console.log(noteId)
// Output: 'a1b2c3d4...' (64 hex chars)

// Same title always produces same ID
const sameId = await hashTitle('My Secret Note')
console.assert(noteId === sameId)
```

### Properties

- ✅ **Deterministic** — Same title → same ID
- ✅ **Irreversible** — Cannot derive title from ID
- ✅ **Safe** — Safe to send to server (not the encryption key)

---

## `deriveKey(title: string): Promise<CryptoKey>`

Derives a 256-bit AES-GCM encryption key from a title. Never sent to the server.

### Parameters

- **`title`** (`string`) — The note title

### Returns

A promise resolving to a `CryptoKey` suitable for AES-256-GCM encryption/decryption.

### Example

```typescript
import { deriveKey, encryptNote } from '@otterseal/core'

const key = await deriveKey('My Secret Note')

// Use for encryption
const encrypted = await encryptNote('content', key)

// Use for decryption
import { decryptNote } from '@otterseal/core'
const decrypted = await decryptNote(encrypted, key)
```

### Properties

- ✅ **Deterministic** — Same title → same key
- ✅ **Private** — Never transmitted
- ✅ **Strong** — 256-bit AES key

---

## `encryptNote(content: string, key: CryptoKey): Promise<string>`

Encrypts content using AES-256-GCM with a random IV.

### Parameters

- **`content`** (`string`) — Plaintext to encrypt
- **`key`** (`CryptoKey`) — Encryption key from `deriveKey()`

### Returns

A promise resolving to a base64-encoded JSON string containing:
- `iv` — Base64-encoded initialization vector
- `data` — Base64-encoded ciphertext

### Example

```typescript
import { deriveKey, encryptNote } from '@otterseal/core'

const key = await deriveKey('My Title')
const encrypted = await encryptNote('This is secret', key)

console.log(encrypted)
// Output: '{"iv":"...","data":"..."}'

// Safe to store/transmit (server cannot decrypt)
```

### Properties

- 🔐 **AES-256-GCM** — Authenticated encryption
- 🎲 **Random IV** — Different output each time (even for same content)
- 📝 **JSON Format** — Easy to parse and store

### Error Handling

Throws if:
- Content is not a string
- Key is invalid
- Encryption fails

---

## `decryptNote(encrypted: string, key: CryptoKey): Promise<string>`

Decrypts AES-256-GCM ciphertext.

### Parameters

- **`encrypted`** (`string`) — Base64 ciphertext from `encryptNote()`
- **`key`** (`CryptoKey`) — Same key used for encryption

### Returns

A promise resolving to the original plaintext string.

### Example

```typescript
import { deriveKey, encryptNote, decryptNote } from '@otterseal/core'

const key = await deriveKey('My Title')
const encrypted = await encryptNote('Secret message', key)
const plaintext = await decryptNote(encrypted, key)

console.log(plaintext) // 'Secret message'
```

### Error Handling

Returns empty string (`''`) if:
- Ciphertext is invalid
- JSON parsing fails
- Key is incorrect
- Ciphertext is tampered with

Example:

```typescript
const result = await decryptNote(badCiphertext, key)

if (result === '') {
  console.error('Decryption failed - corrupted data or wrong key')
}
```

Or throw explicitly:

```typescript
const result = await decryptNote(encrypted, key)

if (result === '') {
  throw new Error('Failed to decrypt note')
}
```

---

## Type Definitions

```typescript
import type { CryptoKey } from '@otterseal/core'

// Encryption key (from deriveKey)
type EncryptionKey = CryptoKey

// Decryption result
type DecryptResult = string // plaintext or ''

// Encrypted data format
interface EncryptedNote {
  iv: string       // base64-encoded IV
  data: string     // base64-encoded ciphertext
}
```

---

## Algorithm Details

| Property | Value |
|----------|-------|
| **Key Derivation** | HKDF-SHA256 |
| **Encryption** | AES-256-GCM |
| **Key Size** | 256 bits |
| **IV Size** | 96 bits (12 bytes) |
| **Authentication** | GCM built-in |
| **Salt** | `'SecurePad'` (hardcoded) |

---

## See Also

- [Installation](/packages/core/installation) — Setup guide
- [Examples on GitHub](https://github.com/ycmjbot/otterseal/tree/main/packages/core)

