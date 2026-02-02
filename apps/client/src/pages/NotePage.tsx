import { decryptNote, deriveKey, encryptNote, hashTitle } from '@otterseal/core';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Editor from '../Editor';

interface NotePageProps {
  onStatusChange?: (status: string | null) => void;
}

export default function NotePage({ onStatusChange }: NotePageProps) {
  const { title: urlTitle } = useParams();
  const rawTitle = decodeURIComponent(urlTitle || '');

  const [debouncedTitle, setDebouncedTitle] = useState(rawTitle);
  const [content, setContent] = useState<string | null>(null);
  const [remoteContent, setRemoteContent] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>('connecting');
  const [key, setKey] = useState<CryptoKey | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef('');

  // Report status changes to App.tsx for header display
  useEffect(() => {
    onStatusChange?.(status);
    return () => onStatusChange?.(null);
  }, [status, onStatusChange]);

  // Debounce title changes for WebSocket connection
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTitle(rawTitle), 300);
    return () => clearTimeout(timer);
  }, [rawTitle]);

  // Reset state on raw title change
  useEffect(() => {
    setContent(null);
    setStatus(null);
  }, [rawTitle]);

  // Check if Lexical content is empty
  function isContentEmpty(jsonStr: string) {
    if (!jsonStr) return true;
    try {
      const data = JSON.parse(jsonStr);
      interface LexicalNode {
        text?: string;
        children?: LexicalNode[];
      }
      const hasText = (node: LexicalNode): boolean => {
        if (node.text?.trim()) return true;
        if (node.children) return node.children.some(hasText);
        return false;
      };
      return !hasText(data.root);
    } catch {
      return !jsonStr.trim();
    }
  }

  async function saveNow(expectedTitle: string) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (debouncedTitle !== expectedTitle) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !key) return;

    if (isContentEmpty(lastContentRef.current)) {
      setStatus('saved');
      return;
    }

    try {
      const encrypted = await encryptNote(lastContentRef.current, key);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'update', content: encrypted }));
        setStatus('saved');
      }
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  }

  // WebSocket connection
  useEffect(() => {
    if (!debouncedTitle) return;

    setContent(null);
    setRemoteContent(null);
    setStatus('connecting');
    lastContentRef.current = '';

    if (wsRef.current) {
      if (timeoutRef.current) saveNow(debouncedTitle);
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    let active = true;

    async function init() {
      const id = await hashTitle(debouncedTitle);
      const k = await deriveKey(debouncedTitle);
      if (!active) return;

      setKey(k);
      connectWS(id, k, debouncedTitle);
    }

    init();

    return () => {
      active = false;
      if (wsRef.current) {
        if (timeoutRef.current) saveNow(debouncedTitle);
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [debouncedTitle]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timeoutRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  function connectWS(id: string, k: CryptoKey, currentTitle: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}?id=${id}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');

    ws.onmessage = async event => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'error') {
          setStatus('error');
          alert(msg.message);
        } else if (msg.type === 'init' || msg.type === 'update') {
          if (msg.content) {
            const decrypted = await decryptNote(msg.content, k);
            if (decrypted !== lastContentRef.current) {
              lastContentRef.current = decrypted;
              if (msg.type === 'init') {
                setContent(decrypted);
              } else {
                setRemoteContent(decrypted);
              }
            }
          } else if (msg.type === 'init') {
            setContent(null);
          }
          setStatus('saved');
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.onclose = () => {
      setStatus('error');
      setTimeout(() => {
        if (
          wsRef.current?.readyState === WebSocket.CLOSED &&
          window.location.pathname.includes(encodeURIComponent(currentTitle))
        ) {
          connectWS(id, k, currentTitle);
        }
      }, 3000);
    };

    ws.onerror = () => setStatus('error');
  }

  const handleChange = (newJson: string) => {
    lastContentRef.current = newJson;
    setStatus('saving');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveNow(debouncedTitle);
    }, 500);
  };

  return (
    <Layout>
      <Editor
        key={debouncedTitle}
        initialContent={content}
        onChange={handleChange}
        remoteContent={remoteContent}
      />
    </Layout>
  );
}
