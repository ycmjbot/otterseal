import React, { useState, useEffect, useRef } from 'react';
import { hashTitle, deriveKey, encryptNote, decryptNote } from './cryptoUtils';
import { Moon, Sun, Loader2, Check, WifiOff } from 'lucide-react';

const FIXED_CONTENT = {
  "": `Welcome to SecurePad.

This is an end-to-end encrypted, anonymous notepad. 
Your notes are encrypted in your browser before being sent to the server.
The server never sees your unencrypted content or your secret title.

To start, type a secret title in the bar above. 
Everything you type here is private and secure.
Share the URL with others to collaborate in real-time.`,

  "about": `About SecurePad

SecurePad was built with privacy in mind.

Features:
- End-to-end encryption: Only you and those with your secret title can read your notes.
- Real-time collaboration: See updates instantly as they happen.
- No accounts: No registration, no tracking, no cookies.
- Open Source: Simple, transparent, and secure.

How it works:
When you enter a title, a unique encryption key is derived from it. 
This key never leaves your browser. 
The title itself is hashed before being sent to the server, so even the "room name" is obscured.`
};

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') };
}

export default function App() {
  const { theme, toggle } = useTheme();
  const [title, setTitle] = useState(() => {
    // Try search params first for backward compatibility, then pathname
    const params = new URLSearchParams(window.location.search);
    const t = params.get('title');
    if (t !== null) return t;
    return window.location.pathname.slice(1);
  });
  const [activeTitle, setActiveTitle] = useState(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle');
  const [key, setKey] = useState(null);
  
  const wsRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    enterRoom(title);

    const handlePopState = () => {
      const newTitle = window.location.pathname.slice(1);
      setTitle(newTitle);
      enterRoom(newTitle);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  async function enterRoom(t) {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setActiveTitle(t);
    
    // Update URL
    const url = new URL(window.location);
    if (t === "") {
      url.pathname = "/";
      url.search = "";
    } else {
      url.pathname = `/${t}`;
      url.search = "";
    }
    if (window.location.pathname !== url.pathname) {
      window.history.pushState({}, '', url);
    }

    if (t === "" || t === "about") {
      setStatus('idle');
      setContent(FIXED_CONTENT[t]);
      setKey(null);
      return;
    }

    setStatus('connecting');
    const id = await hashTitle(t);
    const k = await deriveKey(t);
    setKey(k);
    connectWS(id, k);
  }

  function connectWS(id, k) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}?id=${id}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'error') {
          setStatus('error');
          alert(msg.message);
        } else if (msg.type === 'init' || msg.type === 'update') {
          if (msg.content) {
             const decrypted = await decryptNote(msg.content, k);
             setContent(decrypted);
          } else {
             if (msg.type === 'init') setContent('');
          }
          setStatus('saved');
        }
      } catch (e) {
        console.error(e);
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) setStatus('error');
    };
    
    ws.onerror = () => {
      if (wsRef.current === ws) setStatus('error');
    };
  }

  const handleChange = (e) => {
    if (activeTitle === "" || activeTitle === "about") return;

    const newText = e.target.value;
    setContent(newText);
    setStatus('saving');
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      const encrypted = await encryptNote(newText, key);
      wsRef.current.send(JSON.stringify({ type: 'update', content: encrypted }));
      setStatus('saved');
    }, 500);
  };

  const handleTitleSubmit = (e) => {
    e.preventDefault();
    enterRoom(title);
  };

  const isSpecial = activeTitle === "" || activeTitle === "about";

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors">
       <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
         <div className="flex items-center space-x-4 flex-1">
           <form onSubmit={handleTitleSubmit} className="max-w-md w-full">
             <input
               type="text"
               className="w-full bg-transparent border-none p-0 text-lg font-semibold text-gray-900 dark:text-white focus:ring-0 placeholder:text-gray-400"
               placeholder="Home Page"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               onBlur={() => { if (title !== activeTitle) enterRoom(title); }}
             />
           </form>
           <div className="flex items-center space-x-2 text-sm font-medium whitespace-nowrap">
              {status === 'connecting' && <span className="text-yellow-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Connecting...</span>}
              {status === 'saving' && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
              {status === 'saved' && <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3"/> Saved</span>}
              {status === 'error' && <span className="text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3"/> Offline</span>}
              {status === 'connected' && <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3"/> Connected</span>}
           </div>
         </div>
         <div className="flex items-center space-x-2">
            <button onClick={toggle} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
         </div>
       </header>
       
       <main className="flex-1 relative">
         <textarea
           className={`w-full h-full p-6 resize-none bg-transparent text-gray-800 dark:text-gray-200 text-lg leading-relaxed focus:outline-none font-mono ${isSpecial ? 'opacity-80' : ''}`}
           placeholder={isSpecial ? "" : "Start typing..."}
           value={content}
           onChange={handleChange}
           readOnly={isSpecial}
           spellCheck={false}
         />
       </main>
    </div>
  );
}
