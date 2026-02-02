import crypto from 'node:crypto';
import { decryptNote, deriveKey, encryptNote, hashTitle } from '@otterseal/core';
import { buildCommand, buildRouteMap } from '@stricli/core';
import { getServerUrl } from '../config.js';
import { openEditor, parseDuration, readStdin } from '../utils.js';

// SEND COMMAND
async function sendSecret(flags: {
  readonly content?: string;
  readonly expires?: string;
  readonly selfDestruct?: boolean;
  readonly editor?: boolean;
}) {
  try {
    const { content, expires = '24h', selfDestruct, editor } = flags;
    let finalContent = content;

    if (!finalContent || editor) {
      finalContent = await openEditor(content || '');
    }

    if (!finalContent) {
      const stdin = await readStdin();
      if (stdin) finalContent = stdin;
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
      expiresAt: Date.now() + parseDuration(expires),
      burnAfterReading: selfDestruct || false,
    };

    const res = await fetch(`${serverUrl}/api/notes/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error: string };
      console.error('❌ Error:', err.error || res.status);
      process.exit(1);
    }

    const link = `${serverUrl}/send/${id}#${secretKey}`;
    console.log(link);
    console.error('');
    console.error('✅ Secret created');
    console.error(`⏰ Expires: ${expires}`);
    console.error(`🔥 Self-destruct: ${selfDestruct ? 'yes' : 'no'}`);
  } catch (err) {
    console.error('❌ Error:', (err as Error).message);
    process.exit(1);
  }
}

const sendCommand = buildCommand({
  docs: { brief: 'Create a one-time secret link' },
  func: sendSecret,
  parameters: {
    flags: {
      content: {
        kind: 'parsed',
        parse: String,
        brief: 'Content of the secret',
        optional: true,
      },
      expires: {
        kind: 'parsed',
        parse: String,
        brief: 'Expiration time (e.g., "1h", "30m", "7d")',
        optional: true,
      },
      selfDestruct: {
        kind: 'boolean',
        brief: 'Burn after first read',
        optional: true,
      },
      editor: {
        kind: 'boolean',
        brief: 'Force open $EDITOR',
        optional: true,
      },
    },
  },
});

// REVEAL COMMAND
async function revealSecret(flags: { readonly url: string; readonly peek?: boolean }) {
  try {
    const { url, peek } = flags;
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

    const fetchUrl = peek ? `${serverUrl}/api/notes/${id}?peek=1` : `${serverUrl}/api/notes/${id}`;

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

    const data = (await res.json()) as {
      expiresAt?: number;
      burnAfterReading?: boolean;
      content?: string;
    };

    if (peek) {
      console.error('✅ Secret exists');
      console.error(
        `⏰ Expires: ${data.expiresAt ? new Date(data.expiresAt).toISOString() : 'never'}`,
      );
      console.error(`🔥 Self-destruct: ${data.burnAfterReading ? 'yes' : 'no'}`);
      return;
    }

    const plaintext = await decryptNote(data.content || '', key);
    process.stdout.write(plaintext);

    if (data.burnAfterReading) {
      console.error('\n🔥 (Secret has been burned)');
    }
  } catch (err) {
    console.error('❌ Error:', (err as Error).message);
    process.exit(1);
  }
}

const revealCommand = buildCommand({
  docs: { brief: 'Reveal and decrypt a secret' },
  func: revealSecret,
  parameters: {
    flags: {
      url: {
        kind: 'parsed',
        parse: String,
        brief: 'The secret URL',
      },
      peek: {
        kind: 'boolean',
        brief: 'Check existence without burning',
        optional: true,
      },
    },
  },
});

const peekCommand = buildCommand({
  docs: { brief: 'Check if secret exists without reading' },
  func: (flags: { url: string }) => revealSecret({ ...flags, peek: true }),
  parameters: {
    flags: {
      url: {
        kind: 'parsed',
        parse: String,
        brief: 'The secret URL',
      },
    },
  },
});

export const secretRoutes = buildRouteMap({
  routes: {
    send: sendCommand,
    reveal: revealCommand,
    peek: peekCommand,
  },
  docs: { brief: 'Manage one-time secrets' },
});
