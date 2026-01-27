import React, { useState, useEffect, useRef } from 'react';
import { hashTitle, deriveKey, encryptNote, decryptNote } from './cryptoUtils';
import { Moon, Sun, Loader2, Check, WifiOff } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [active, setActive] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle');
  const [key, setKey] = useState(null);
  
  const wsRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('title');
    if (t) {
      setTitle(t);
      enterRoom(t);
    }
  }, []);

  async function enterRoom(t) {
    if (!t) return;
    setStatus('connecting');
    const id = await hashTitle(t);
    const k = await deriveKey(t);
    setKey(k);
    setActive(true);
    
    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('title', t);
    window.history.pushState({}, '', url);
    
    connectWS(id, k);
  }

  function connectWS(id, k) {
    // Determine WS URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Includes port if present
    const wsUrl = `${protocol}//${host}?id=${id}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'error') {
          setStatus('error');
          alert(msg.message); // Simple alert for now, or use a toast
        } else if (msg.type === 'init' || msg.type === 'update') {
          if (msg.content) {
             const decrypted = await decryptNote(msg.content, k);
             // Simple collision handling: if we are "saving", maybe ignore? 
             // But for LWW, we just accept everything.
             // Ideally we check if it differs to avoid cursor jumps, but textarea controlled input is tricky.
             // We'll update state. Cursor position management is hard in controlled components with async updates.
             // We'll just setContent.
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
      setStatus('error');
      // Retry
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
           connectWS(id, k);
        }
      }, 3000);
    };
    
    ws.onerror = () => setStatus('error');
  }

  const handleChange = (e) => {
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

  if (!active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
           <div className="text-center">
             <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">SecurePad</h1>
             <p className="mt-2 text-gray-600 dark:text-gray-400">End-to-end encrypted, anonymous notepad.</p>
           </div>
           
           <form onSubmit={(e) => { e.preventDefault(); enterRoom(title); }} className="mt-8 space-y-6">
             <input
               type="text"
               required
               autoFocus
               className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:ring-gray-700 dark:text-white transition-all"
               placeholder="Enter a secret title..."
               value={title}
               onChange={(e) => setTitle(e.target.value)}
             />
             <button
               type="submit"
               className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
             >
               Open Note
             </button>
           </form>
           
           <button onClick={toggle} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
             {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors">
       <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
         <div className="flex items-center space-x-4">
           <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[200px]" title={title}>{title}</h1>
           <div className="flex items-center space-x-2 text-sm font-medium">
              {status === 'connecting' && <span className="text-yellow-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Connecting...</span>}
              {status === 'saving' && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
              {status === 'saved' && <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3"/> Saved</span>}
              {status === 'error' && <span className="text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3"/> Offline</span>}
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
           className="w-full h-full p-6 resize-none bg-transparent text-gray-800 dark:text-gray-200 text-lg leading-relaxed focus:outline-none font-mono"
           placeholder="Start typing..."
           value={content}
           onChange={handleChange}
           spellCheck={false}
         />
       </main>
    </div>
  );
}
