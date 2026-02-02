import { CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { TRANSFORMERS } from '@lexical/markdown';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { useEffect, useRef } from 'react';

const lexicalTheme = {
  paragraph: 'mb-2 text-gray-800 dark:text-gray-200',
  heading: {
    h1: 'text-3xl font-bold mb-4 mt-6 text-gray-900 dark:text-white',
    h2: 'text-2xl font-bold mb-3 mt-5 text-gray-900 dark:text-white',
    h3: 'text-xl font-bold mb-2 mt-4 text-gray-900 dark:text-white',
  },
  list: {
    ul: 'list-disc list-inside mb-4 ml-4',
    ol: 'list-decimal list-inside mb-4 ml-4',
  },
  quote:
    'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-4',
  code: 'font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded text-sm',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
};

function UpdatePlugin({ initialJSON }: { initialJSON: string }) {
  const [editor] = useLexicalComposerContext();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current && initialJSON) {
      isFirstRun.current = false;
      try {
        const state = editor.parseEditorState(initialJSON);
        editor.setEditorState(state);
      } catch (e) {
        console.error('Failed to parse initial JSON', e);
      }
    }
  }, [initialJSON, editor]);

  return null;
}

// External control plugin to force update when remote changes happen
function RemoteUpdatePlugin({ json }: { json: string }) {
  const [editor] = useLexicalComposerContext();
  const lastJsonRef = useRef(json);

  useEffect(() => {
    if (json && json !== lastJsonRef.current) {
      lastJsonRef.current = json;
      try {
        const state = editor.parseEditorState(json);
        editor.setEditorState(state);
      } catch (e) {
        console.error('Failed to sync remote JSON', e);
      }
    }
  }, [json, editor]);
  return null;
}

interface EditorProps {
  initialContent: string | null;
  onChange: (json: string) => void;
  remoteContent: string | null;
}

export default function Editor({ initialContent, onChange, remoteContent }: EditorProps) {
  const config = {
    namespace: 'SecurePad',
    theme: lexicalTheme,
    onError: console.error,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode, AutoLinkNode],
  };

  return (
    <LexicalComposer initialConfig={config}>
      <div className="relative min-h-[500px]">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[500px] outline-none prose dark:prose-invert max-w-none" />
          }
          placeholder={
            <div className="absolute top-0 left-0 text-gray-400 pointer-events-none">
              Start typing... (Markdown supported)
            </div>
          }
          ErrorBoundary={({ children }) => <>{children}</>}
        />
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin
          onChange={editorState => {
            const json = JSON.stringify(editorState.toJSON());
            onChange(json);
          }}
        />
        {initialContent && <UpdatePlugin initialJSON={initialContent} />}
        {remoteContent && <RemoteUpdatePlugin json={remoteContent} />}
      </div>
    </LexicalComposer>
  );
}
