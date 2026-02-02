import { decryptNote, deriveKey, encryptNote, hashTitle } from '@otterseal/core';
import { buildCommand, buildRouteMap } from '@stricli/core';
import { getServerUrl } from '../config.js';
import { openEditor, readStdin } from '../utils.js';

// READ COMMAND
async function readNote(flags: { readonly title: string }) {
  try {
    const serverUrl = await getServerUrl();
    const id = await hashTitle(flags.title);
    const key = await deriveKey(flags.title);

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

    const { content: encryptedContent } = (await res.json()) as { content: string };
    const plaintext = await decryptNote(encryptedContent, key);
    process.stdout.write(plaintext);
  } catch (err) {
    console.error('❌ Error:', (err as Error).message);
    process.exit(1);
  }
}

const readCommand = buildCommand({
  docs: { brief: 'Read and decrypt a note' },
  func: readNote,
  parameters: {
    flags: {
      title: {
        kind: 'parsed',
        parse: String,
        brief: 'Title of the note',
      },
    },
  },
});

// EDIT COMMAND
async function editNote(flags: {
  readonly title: string;
  readonly content?: string;
  readonly editor?: boolean;
}) {
  try {
    let finalContent = flags.content;

    if (!finalContent || flags.editor) {
      finalContent = await openEditor(flags.content || '');
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
    const id = await hashTitle(flags.title);
    const key = await deriveKey(flags.title);
    const encrypted = await encryptNote(finalContent, key);

    const res = await fetch(`${serverUrl}/api/notes/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: encrypted }),
    });

    if (!res.ok) {
      const err = (await res.json()) as { error: string };
      console.error('❌ Error:', err.error || res.status);
      process.exit(1);
    }

    console.error('✅ Note saved');
    console.error(`📝 Title: ${flags.title}`);
  } catch (err) {
    console.error('❌ Error:', (err as Error).message);
    process.exit(1);
  }
}

const editCommand = buildCommand({
  docs: { brief: 'Create or edit a note' },
  func: editNote,
  parameters: {
    flags: {
      title: {
        kind: 'parsed',
        parse: String,
        brief: 'Title of the note',
      },
      content: {
        kind: 'parsed',
        parse: String,
        brief: 'Content of the note',
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

export const noteRoutes = buildRouteMap({
  routes: {
    read: readCommand,
    edit: editCommand,
  },
  docs: { brief: 'Manage encrypted notes' },
});
