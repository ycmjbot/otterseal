import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from './config.ts';

export async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function openEditor(defaultContent = '') {
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

const MULTIPLIERS: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
export function parseDuration(str: string) {
  const match = str.match(/^(\d+)([smhd])$/) ?? [];
  const [, num, unit] = match;
  if (!num || !unit || !MULTIPLIERS[unit])
    throw new Error(`Invalid duration: ${str}. Use format like "1h", "30m", "1d"`);
  return parseInt(num, 10) * MULTIPLIERS[unit];
}
