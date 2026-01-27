import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hashTitle, deriveKey, encryptNote, decryptNote } from './cryptoUtils';
import { Loader2, Check, WifiOff, Star, Moon, Sun, Lock, Shield, Zap, Sparkles, ArrowRight, Github } from 'lucide-react';
import Editor from './Editor';
import clsx from 'clsx';

// Static content for special pages
function HomeContent({ onNavigate }) {
  const [inputTitle, setInputTitle] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputTitle.trim();
    if (trimmed) {
      onNavigate(trimmed);
    }
  };

  const handleRandom = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    onNavigate(randomId);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 text-center py-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
            <Lock className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to SecurePad
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Zero-knowledge encrypted notes. No signup. No passwords.<br />
          Just type a title and start writing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="note-title-home"
          autoComplete="off"
          spellCheck="false"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          placeholder="Enter a note title..."
          className="w-full px-5 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!inputTitle.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            Open Note
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleRandom}
            className="px-6 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Random
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left">
          <Shield className="w-6 h-6 text-green-500 mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">End-to-End Encrypted</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">AES-256 encryption. Server never sees your content.</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left">
          <Zap className="w-6 h-6 text-yellow-500 mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Real-Time Sync</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Share the title. Collaborate instantly.</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left">
          <Lock className="w-6 h-6 text-indigo-500 mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Zero Knowledge</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Title = password. We can't recover it.</p>
        </div>
      </div>
    </div>
  );
}

function AboutContent() {
  return (
    <div className="max-w-2xl mx-auto py-8 prose dark:prose-invert">
      <div className="flex items-center gap-3 mb-6 not-prose">
        <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white m-0">How SecurePad Works</h2>
      </div>
      <p className="lead">Zero-knowledge, real-time collaboration.</p>

      <h3>The Concept</h3>
      <p>
        SecurePad allows you to create instant, encrypted notes just by navigating to a URL. 
        No signups, no passwords, no databases storing your raw text.
      </p>

      <h3>Encryption (The Geeky Stuff)</h3>
      <ul>
        <li>
          <strong>ID Hashing:</strong> The title of your note is hashed using <code>SHA-256</code>. 
          The server only sees this hash, so it never knows the real title.
        </li>
        <li>
          <strong>Client-Side Encryption:</strong> Your content is encrypted in your browser using <code>AES-256-GCM</code>. 
          The encryption key is derived from the note title itself.
        </li>
        <li>
          <strong>Zero Knowledge:</strong> The server receives only encrypted blobs. 
          It cannot read your notes, and it cannot recover them if you forget the title.
        </li>
      </ul>

      <h3>Inspiration & Credits</h3>
      <p>
        This project is heavily inspired by the simplicity of{' '}
        <a href="https://github.com/routman/publicnote.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
          publicnote.com <Github className="w-3 h-3"/>
        </a>.
      </p>
      
      <hr />
      <p className="text-sm text-gray-500 text-center">
        Built with ❤️ by <strong>JBot</strong> • v1.0.0
      </p>
    </div>
  );
}

export default function Note({ isStarred, onToggleStar, onOpenSidebar, theme, onToggleTheme, isHomePage }) {
  const { title: urlTitle } = useParams();
  const rawTitle = decodeURIComponent(urlTitle || '');
  
  // Special pages
  const isHome = isHomePage || rawTitle === '';
  const isAbout = rawTitle.toLowerCase() === 'about';
  const isSpecialPage = isHome || isAbout;
  
  // Display title
  const title = isHome ? '' : rawTitle;
  const displayTitle = isHome ? 'Home' : rawTitle;
  const placeholderTitle = isHome ? 'Home Page' : '';
  
  const navigate = useNavigate();

  const [debouncedTitle, setDebouncedTitle] = useState(rawTitle);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTitle(rawTitle), 300);
    return () => clearTimeout(timer);
  }, [rawTitle]);

  const [content, setContent] = useState(null); 
  const [remoteContent, setRemoteContent] = useState(null);
  const [status, setStatus] = useState(isSpecialPage ? 'static' : 'connecting');
  const [key, setKey] = useState(null);
  
  const wsRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastContentRef = useRef(""); 

  // Immediate state reset on raw title change
  useEffect(() => {
    if (!isSpecialPage) {
      setContent(null);
      setStatus(null); // Show nothing during transition
    }
  }, [rawTitle, isSpecialPage]);

  // Check if Lexical content is empty (no text)
  function isContentEmpty(jsonStr) {
    if (!jsonStr) return true;
    try {
      const data = JSON.parse(jsonStr);
      // Recursively check if there's any actual text
      const hasText = (node) => {
        if (node.text && node.text.trim()) return true;
        if (node.children) return node.children.some(hasText);
        return false;
      };
      return !hasText(data.root);
    } catch {
      return !jsonStr.trim();
    }
  }

  async function saveNow(expectedTitle) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (debouncedTitle !== expectedTitle) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !key) return;
    
    // Don't save empty content - no point wasting space
    if (isContentEmpty(lastContentRef.current)) {
      setStatus('saved');
      return;
    }
    
    try {
      const encrypted = await encryptNote(lastContentRef.current, key);
      // Extra safety: ensure we're still connected and it's the right room
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'update', content: encrypted }));
        setStatus('saved');
      }
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  }

  useEffect(() => {
    if (isSpecialPage || !debouncedTitle) return;
    
    // Reset state on title change
    setContent(null);
    setRemoteContent(null);
    setStatus('connecting');
    lastContentRef.current = "";
    
    // Cleanup old WS
    if (wsRef.current) {
        // Force save any pending changes before closing
        if (timeoutRef.current) saveNow(debouncedTitle);
        wsRef.current.onclose = null; // Prevent "Offline" flash
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
  }, [debouncedTitle, isSpecialPage]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (timeoutRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  function connectWS(id, k, currentTitle) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; 
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
        if (wsRef.current?.readyState === WebSocket.CLOSED && window.location.pathname.includes(encodeURIComponent(currentTitle))) {
           connectWS(id, k, currentTitle);
        }
      }, 3000);
    };
    
    ws.onerror = () => setStatus('error');
  }

  const handleChange = (newJson) => {
    lastContentRef.current = newJson;
    setStatus('saving');
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      saveNow(debouncedTitle);
    }, 500);
  };

  const [localTitle, setLocalTitle] = useState(title);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleTitleChange = (newTitle) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      navigate('/');
    } else if (trimmed.toLowerCase() === 'about') {
      navigate('/about');
    } else {
      navigate(`/${encodeURIComponent(newTitle)}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
       <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
         <div className="flex items-center gap-3 min-w-0">
           <button onClick={onOpenSidebar} className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden">
              <span className="sr-only">Menu</span>
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
           </button>
           
           <div className="flex flex-col min-w-0">
             <div className="flex items-center gap-2">
                <input
                    type="text"
                    name="note-title-header"
                    autoComplete="off"
                    spellCheck="false"
                    value={localTitle}
                    placeholder={placeholderTitle}
                    onChange={(e) => {
                        setLocalTitle(e.target.value);
                        handleTitleChange(e.target.value);
                    }}
                    onBlur={(e) => {
                        const trimmed = e.target.value.trim();
                        if (!trimmed && !isHome) {
                            navigate('/');
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.target.blur();
                        }
                    }}
                    className="text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none max-w-[300px] truncate transition-colors placeholder-gray-400"
                    title="Type a title to open a note"
                />
                {!isSpecialPage && (
                  <button 
                      onClick={() => onToggleStar(rawTitle)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                      <Star className={clsx("w-4 h-4", isStarred(rawTitle) ? "fill-yellow-400 text-yellow-400" : "text-gray-400")} />
                  </button>
                )}
             </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {isHome ? 'Type a title to open or create a note' : 'Click title to rename • Changes URL'}
             </p>
           </div>

           {!isSpecialPage && (
             <div className="flex items-center space-x-2 text-sm font-medium border-l border-gray-200 dark:border-gray-700 pl-3 ml-2">
                {status === 'connecting' && <span className="text-yellow-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> <span className="hidden sm:inline">Connecting</span></span>}
                {status === 'saving' && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> <span className="hidden sm:inline">Saving</span></span>}
                {status === 'saved' && <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3"/> <span className="hidden sm:inline">Saved</span></span>}
                {status === 'error' && <span className="text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3"/> <span className="hidden sm:inline">Offline</span></span>}
             </div>
           )}
         </div>
         
         <div className="flex items-center gap-2">
            <button 
                onClick={onToggleTheme} 
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
         </div>
       </header>
       
       <main className="flex-1 relative p-4 md:p-8 md:max-w-4xl md:mx-auto w-full">
         {isHome && <HomeContent onNavigate={handleTitleChange} />}
         {isAbout && <AboutContent />}
         {!isSpecialPage && (
           <Editor 
              key={debouncedTitle}
              initialContent={content} 
              onChange={handleChange}
              remoteContent={remoteContent}
           />
         )}
       </main>
    </div>
  );
}
