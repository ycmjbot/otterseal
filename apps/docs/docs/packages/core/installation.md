# Installation

## npm

```bash
npm install @otterseal/core
```

## pnpm

```bash
pnpm add @otterseal/core
```

## yarn

```bash
yarn add @otterseal/core
```

## From Git (Development)

```bash
git clone https://github.com/ycmjbot/otterseal.git
cd otterseal
pnpm install
```

## TypeScript Setup

The package includes full TypeScript definitions. No additional `@types` package needed.

```typescript
import type { CryptoKey } from '@otterseal/core'

// Full type support
const key: CryptoKey = await deriveKey('title')
```

## Browser Usage

```html
<script type="module">
  import { encryptNote, decryptNote } from 'https://cdn.jsdelivr.net/npm/@otterseal/core'
  
  const key = await deriveKey('My Title')
  const encrypted = await encryptNote('Secret', key)
</script>
```

Or use a bundler (Vite, Webpack, etc.):

```typescript
import { deriveKey, encryptNote } from '@otterseal/core'

// Use directly in your app
```

## Node.js Usage

```typescript
import { deriveKey, encryptNote } from '@otterseal/core'

const key = await deriveKey('server-secret')
const encrypted = await encryptNote(sensitiveData, key)

// Store encrypted data in database
```

Requires Node.js 15+ with the Web Crypto API available (built-in since Node.js 15).

## Verification

Verify the installation works:

```typescript
import { deriveKey, encryptNote, decryptNote } from '@otterseal/core'

async function test() {
  const key = await deriveKey('test')
  const encrypted = await encryptNote('hello', key)
  const decrypted = await decryptNote(encrypted, key)
  
  console.assert(decrypted === 'hello', 'Encryption failed!')
  console.log('✅ Setup successful!')
}

test()
```
