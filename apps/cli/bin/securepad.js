#!/usr/bin/env node

import { program } from 'commander';
import { hashTitle, deriveKey, encryptNote, decryptNote } from '@securepad/shared';
import crypto from 'crypto';

const BASE_URL = process.env.SECUREPAD_URL || 'https://securepad.jbot.ycmjason.com';

// Helper: read stdin
async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// Helper: parse duration string to ms (e.g., "1h", "30m", "1d")
function parseDuration(str) {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${str}`);
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(num) * multipliers[unit];
}

// Helper: generate random key for send links
function generateKey() {
  return crypto.randomBytes(16).toString('base64url');
}

program
  .name('securepad')
  .description('Zero-knowledge encrypted notepad CLI')
  .version('1.0.0');

// READ command
program
  .command('read <title>')
  .alias('get')
  .description('Read and decrypt a note by title')
  .action(async (title) => {
    try {
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      
      const res = await fetch(`${BASE_URL}/api/notes/${id}`);
      if (res.status === 404) {
        console.error('Note not found');
        process.exit(1);
      }
      if (res.status === 410) {
        console.error('Note has expired');
        process.exit(1);
      }
      if (!res.ok) {
        console.error(`Error: ${res.status}`);
        process.exit(1);
      }
      
      const { content } = await res.json();
      const plaintext = await decryptNote(content, key);
      process.stdout.write(plaintext);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// WRITE command
program
  .command('write <title> [content]')
  .alias('set')
  .description('Encrypt and write a note (reads from stdin if no content provided)')
  .option('-e, --expires <duration>', 'Expiration time (e.g., 1h, 30m, 1d)')
  .option('-b, --burn', 'Burn after reading (delete after first read)')
  .action(async (title, content, options) => {
    try {
      // Read from stdin if no content provided
      if (!content) {
        content = await readStdin();
        if (!content) {
          console.error('Error: No content provided. Pass content as argument or pipe via stdin.');
          process.exit(1);
        }
      }
      
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      const encrypted = await encryptNote(content, key);
      
      const body = { content: encrypted };
      if (options.expires) {
        body.expiresAt = Date.now() + parseDuration(options.expires);
      }
      if (options.burn) {
        body.burnAfterReading = true;
      }
      
      const res = await fetch(`${BASE_URL}/api/notes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error('Error:', err.error || res.status);
        process.exit(1);
      }
      
      console.error('✓ Note saved');
      console.error(`  URL: ${BASE_URL}/${encodeURIComponent(title)}`);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// SEND command (one-time secret sharing)
program
  .command('send [content]')
  .description('Create a one-time secret link (reads from stdin if no content provided)')
  .option('-e, --expires <duration>', 'Expiration time (e.g., 1h, 30m, 1d)', '24h')
  .option('-b, --burn', 'Burn after reading (default: true)', true)
  .option('--no-burn', 'Allow multiple reads')
  .action(async (content, options) => {
    try {
      // Read from stdin if no content provided
      if (!content) {
        content = await readStdin();
        if (!content) {
          console.error('Error: No content provided. Pass content as argument or pipe via stdin.');
          process.exit(1);
        }
      }
      
      // Generate a random key for the link
      const secretKey = generateKey();
      const id = await hashTitle(secretKey);
      const key = await deriveKey(secretKey);
      const encrypted = await encryptNote(content, key);
      
      const body = {
        content: encrypted,
        expiresAt: Date.now() + parseDuration(options.expires),
        burnAfterReading: options.burn
      };
      
      const res = await fetch(`${BASE_URL}/api/notes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error('Error:', err.error || res.status);
        process.exit(1);
      }
      
      // Output the shareable link
      const link = `${BASE_URL}/send/${id}#${secretKey}`;
      console.log(link);
      
      console.error('');
      console.error(`✓ Secret created`);
      console.error(`  Expires: ${options.expires}`);
      console.error(`  Burn after reading: ${options.burn ? 'yes' : 'no'}`);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// RECEIVE command (fetch one-time secret)
program
  .command('receive <url>')
  .alias('fetch')
  .description('Fetch and decrypt a secret from a send link')
  .option('--peek', 'Check if note exists without reading (won\'t trigger burn)')
  .action(async (url, options) => {
    try {
      // Parse the URL to extract id and key
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      const secretKey = parsed.hash.slice(1); // Remove the #
      
      if (!id || !secretKey) {
        console.error('Error: Invalid send link format');
        process.exit(1);
      }
      
      const key = await deriveKey(secretKey);
      
      const fetchUrl = options.peek 
        ? `${BASE_URL}/api/notes/${id}?peek=1`
        : `${BASE_URL}/api/notes/${id}`;
      
      const res = await fetch(fetchUrl);
      
      if (res.status === 404) {
        console.error('Secret not found (may have been burned or never existed)');
        process.exit(1);
      }
      if (res.status === 410) {
        console.error('Secret has expired');
        process.exit(1);
      }
      if (!res.ok) {
        console.error(`Error: ${res.status}`);
        process.exit(1);
      }
      
      const data = await res.json();
      
      if (options.peek) {
        console.error('✓ Secret exists');
        console.error(`  Expires: ${data.expiresAt ? new Date(data.expiresAt).toISOString() : 'never'}`);
        console.error(`  Burn after reading: ${data.burnAfterReading ? 'yes' : 'no'}`);
        return;
      }
      
      const plaintext = await decryptNote(data.content, key);
      process.stdout.write(plaintext);
      
      if (data.burnAfterReading) {
        console.error('\n(This secret has been burned and can no longer be accessed)');
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// DELETE command
program
  .command('delete <title>')
  .alias('rm')
  .description('Delete a note by title (writes empty content)')
  .action(async (title) => {
    try {
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      
      // Write empty encrypted content with immediate expiry
      const encrypted = await encryptNote('', key);
      const body = {
        content: encrypted,
        expiresAt: Date.now() - 1000, // Already expired
        burnAfterReading: false
      };
      
      const res = await fetch(`${BASE_URL}/api/notes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        console.error('Error:', res.status);
        process.exit(1);
      }
      
      console.error('✓ Note deleted');
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse();
