import { describe, expect, it } from 'vitest';
import { decryptNote, deriveKey, encryptNote, hashTitle } from './index.ts';

describe('Core Crypto Functions', () => {
  describe('hashTitle', () => {
    it('should generate a deterministic hash for the same title', async () => {
      const title = 'My Secret Note';
      const hash1 = await hashTitle(title);
      const hash2 = await hashTitle(title);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different titles', async () => {
      const hash1 = await hashTitle('Title A');
      const hash2 = await hashTitle('Title B');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', async () => {
      const hash = await hashTitle('');
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[0-9a-f]{64}$/); // 256-bit hex
    });

    it('should handle unicode characters', async () => {
      const hash = await hashTitle('你好世界 🌍');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return 64-character hex string (256-bit)', async () => {
      const hash = await hashTitle('Test Title');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('deriveKey', () => {
    it('should derive a valid AES-GCM CryptoKey', async () => {
      const key = await deriveKey('Test Title');
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('should derive the same key from the same title', async () => {
      const title = 'Consistent Title';
      const key1 = await deriveKey(title);
      const key2 = await deriveKey(title);

      // Keys should be usable for encryption/decryption
      const plaintext = 'test data';
      const encrypted1 = await encryptNote(plaintext, key1);
      const decrypted2 = await decryptNote(encrypted1, key2);
      expect(decrypted2).toBe(plaintext);
    });

    it('should derive different keys from different titles', async () => {
      const key1 = await deriveKey('Title A');
      const key2 = await deriveKey('Title B');

      const plaintext = 'test data';
      const encrypted = await encryptNote(plaintext, key1);

      // key2 should fail to decrypt
      const decrypted = await decryptNote(encrypted, key2);
      expect(decrypted).toBe(''); // Decryption fails, returns empty string
    });
  });

  describe('encryptNote + decryptNote', () => {
    it('should encrypt and decrypt plaintext correctly', async () => {
      const title = 'Test Note';
      const plaintext = 'This is a secret message';
      const key = await deriveKey(title);

      const encrypted = await encryptNote(plaintext, key);
      const decrypted = await decryptNote(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string encryption', async () => {
      const key = await deriveKey('Empty');
      const encrypted = await encryptNote('', key);
      const decrypted = await decryptNote(encrypted, key);
      expect(decrypted).toBe('');
    });

    it('should handle large content', async () => {
      const key = await deriveKey('Large');
      const plaintext = 'x'.repeat(10000);

      const encrypted = await encryptNote(plaintext, key);
      const decrypted = await decryptNote(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', async () => {
      const key = await deriveKey('IV Test');
      const plaintext = 'Same plaintext';

      const encrypted1 = await encryptNote(plaintext, key);
      const encrypted2 = await encryptNote(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
      expect(JSON.parse(encrypted1).iv).not.toBe(JSON.parse(encrypted2).iv);
    });

    it('should return empty string when decrypting invalid JSON', async () => {
      const key = await deriveKey('Invalid');
      const decrypted = await decryptNote('not valid json', key);
      expect(decrypted).toBe('');
    });

    it('should return empty string when decrypting malformed ciphertext', async () => {
      const key = await deriveKey('Malformed');
      const malformed = JSON.stringify({ iv: 'invalid', data: 'invalid' });
      const decrypted = await decryptNote(malformed, key);
      expect(decrypted).toBe('');
    });

    it('should return empty string for null/undefined input', async () => {
      const key = await deriveKey('Null Test');
      expect(await decryptNote('', key)).toBe('');
      // @ts-expect-error - testing error handling for invalid input
      expect(await decryptNote(null, key)).toBe('');
    });

    it('should handle unicode in plaintext', async () => {
      const key = await deriveKey('Unicode');
      const plaintext = '你好世界 🌍 مرحبا العالم';

      const encrypted = await encryptNote(plaintext, key);
      const decrypted = await decryptNote(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });
  });
});
