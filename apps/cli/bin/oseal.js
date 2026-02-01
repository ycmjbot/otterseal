#!/usr/bin/env node

import { Command } from 'commander';
import { hashTitle, deriveKey, encryptNote, decryptNote } from '@otterseal/core';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

// Constants
const DEFAULT_SERVER_URL = 'https://otterseal.ycmj.bot';
const CONFIG_FILE = path.join(os.homedir(), '.oseal.json');

// Load config
async function loadConfig() {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

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

// Helper: open editor
async function openEditor(defaultContent = '') {
  const config = await loadConfig();
  const editor = config.editor || process.env.EDITOR || 'nano';
  const tempFile = path.join(os.tmpdir(), `oseal-${Date.now()}.txt`);
  
  await fs.writeFile(tempFile, defaultContent);
  
  try {
    execSync(`${editor} "${tempFile}"`, { stdio: 'inherit' });
    const content = await fs.readFile(tempFile, 'utf-8');
    return content.trim();
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

// Helper: parse duration
function parseDuration(str) {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${str}. Use format like "1h", "30m", "1d"`);
  const [, num, unit] = match;
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(num) * multipliers[unit];
}

// Helper: get server URL
async function getServerUrl() {
  const config = await loadConfig();
  return config.server_url || DEFAULT_SERVER_URL;
}

// Main program
const program = new Command()
  .name('oseal')
  .description('🦦 OtterSeal - Zero-knowledge encrypted secrets')
  .version('1.0.0');

// NOTE COMMAND
const noteCommand = new Command()
  .name('note')
  .description('Manage encrypted notes');

noteCommand
  .command('read <title>')
  .description('Read and decrypt a note')
  .action(async (title) => {
    try {
      const serverUrl = await getServerUrl();
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      
      const res = await fetch(`${serverUrl}/api/notes/${id}`);
      
      if (res.status === 404) {
        console.error('❌ Note not found');
        process.exit(1);
      }
      if (res.status === 410) {
        console.error('❌ Note has expired');
        process.exit(1);
      }
      if (!res.ok) {
        console.error(`❌ Error: ${res.status}`);
        process.exit(1);
      }
      
      const { content } = await res.json();
      const plaintext = await decryptNote(content, key);
      process.stdout.write(plaintext);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

noteCommand
  .command('edit <title> [content]')
  .option('--editor', 'Force open $EDITOR')
  .description('Create or edit a note')
  .action(async (title, content, options) => {
    try {
      let finalContent = content;
      
      if (!finalContent || options.editor) {
        finalContent = await openEditor(content || '');
      }
      
      if (!finalContent) {
        finalContent = await readStdin();
      }
      
      if (!finalContent) {
        console.error('❌ No content provided');
        process.exit(1);
      }
      
      const serverUrl = await getServerUrl();
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      const encrypted = await encryptNote(finalContent, key);
      
      const res = await fetch(`${serverUrl}/api/notes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: encrypted })
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error('❌ Error:', err.error || res.status);
        process.exit(1);
      }
      
      console.error('✅ Note saved');
      console.error(`📝 Title: ${title}`);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program.addCommand(noteCommand);

// SECRET COMMAND
const secretCommand = new Command()
  .name('secret')
  .description('Manage one-time secrets');

secretCommand
  .command('send [content]')
  .option('--expires <duration>', 'Expiration time (e.g., "1h", "30m", "7d")', '24h')
  .option('--self-destruct', 'Burn after first read (default: false)')
  .option('--editor', 'Force open $EDITOR')
  .description('Create a one-time secret link')
  .action(async (content, options) => {
    try {
      let finalContent = content;
      
      if (!finalContent || options.editor) {
        finalContent = await openEditor(content || '');
      }
      
      if (!finalContent) {
        finalContent = await readStdin();
      }
      
      if (!finalContent) {
        console.error('❌ No content provided');
        process.exit(1);
      }
      
      const serverUrl = await getServerUrl();
      const secretKey = crypto.randomBytes(16).toString('base64url');
      const id = await hashTitle(secretKey);
      const key = await deriveKey(secretKey);
      const encrypted = await encryptNote(finalContent, key);
      
      const body = {
        content: encrypted,
        expiresAt: Date.now() + parseDuration(options.expires),
        burnAfterReading: options.selfDestruct || false
      };
      
      const res = await fetch(`${serverUrl}/api/notes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error('❌ Error:', err.error || res.status);
        process.exit(1);
      }
      
      const link = `${serverUrl}/send/${id}#${secretKey}`;
      console.log(link);
      console.error('');
      console.error('✅ Secret created');
      console.error(`⏰ Expires: ${options.expires}`);
      console.error(`🔥 Self-destruct: ${options.selfDestruct ? 'yes' : 'no'}`);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

secretCommand
  .command('reveal <url>')
  .option('--peek', 'Check existence without burning')
  .description('Reveal and decrypt a secret')
  .action(async (url, options) => {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/');
      const id = pathParts[pathParts.length - 1];
      const secretKey = parsed.hash.slice(1);
      
      if (!id || !secretKey) {
        console.error('❌ Invalid secret link format');
        process.exit(1);
      }
      
      const serverUrl = await getServerUrl();
      const key = await deriveKey(secretKey);
      
      const fetchUrl = options.peek 
        ? `${serverUrl}/api/notes/${id}?peek=1`
        : `${serverUrl}/api/notes/${id}`;
      
      const res = await fetch(fetchUrl);
      
      if (res.status === 404) {
        console.error('❌ Secret not found (may have been burned)');
        process.exit(1);
      }
      if (res.status === 410) {
        console.error('❌ Secret has expired');
        process.exit(1);
      }
      if (!res.ok) {
        console.error(`❌ Error: ${res.status}`);
        process.exit(1);
      }
      
      const data = await res.json();
      
      if (options.peek) {
        console.error('✅ Secret exists');
        console.error(`⏰ Expires: ${data.expiresAt ? new Date(data.expiresAt).toISOString() : 'never'}`);
        console.error(`🔥 Self-destruct: ${data.burnAfterReading ? 'yes' : 'no'}`);
        return;
      }
      
      const plaintext = await decryptNote(data.content, key);
      process.stdout.write(plaintext);
      
      if (data.burnAfterReading) {
        console.error('\n🔥 (Secret has been burned)');
      }
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

secretCommand
  .command('peek <url>')
  .description('Check if secret exists without reading')
  .action(async (url) => {
    // Delegate to reveal with --peek
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    const secretKey = parsed.hash.slice(1);
    
    if (!id || !secretKey) {
      console.error('❌ Invalid secret link format');
      process.exit(1);
    }
    
    const serverUrl = await getServerUrl();
    const key = await deriveKey(secretKey);
    
    try {
      const res = await fetch(`${serverUrl}/api/notes/${id}?peek=1`);
      
      if (res.status === 404) {
        console.error('❌ Secret not found (may have been burned)');
        process.exit(1);
      }
      if (res.status === 410) {
        console.error('❌ Secret has expired');
        process.exit(1);
      }
      if (!res.ok) {
        console.error(`❌ Error: ${res.status}`);
        process.exit(1);
      }
      
      const data = await res.json();
      console.error('✅ Secret exists');
      console.error(`⏰ Expires: ${data.expiresAt ? new Date(data.expiresAt).toISOString() : 'never'}`);
      console.error(`🔥 Self-destruct: ${data.burnAfterReading ? 'yes' : 'no'}`);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program.addCommand(secretCommand);

// Parse and execute
program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
