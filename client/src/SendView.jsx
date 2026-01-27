import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { hashTitle, deriveKey, decryptNote } from './cryptoUtils';
import { Mail, MailOpen, Copy, Check, Clock, Flame, AlertTriangle, XCircle, Moon, Sun, Send, ArrowLeft } from 'lucide-react';

export default function SendView({ theme, onToggleTheme, onOpenSidebar }) {
  const { uuid } = useParams();
  const [searchParams] = useSearchParams();
  const isCreator = searchParams.get('created') === '1';

  const [status, setStatus] = useState('loading'); // loading, ready, opened, notfound, expired, error
  const [metadata, setMetadata] = useState(null);
  const [content, setContent] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const title = `/send/${uuid}`;
  const shareUrl = window.location.origin + `/send/${uuid}`;

  // Load metadata on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const id = await hashTitle(title);
        const response = await fetch(`/api/notes/${id}?peek=1`);
        
        if (response.status === 404) {
          setStatus('notfound');
          return;
        }
        if (response.status === 410) {
          setStatus('expired');
          return;
        }
        if (!response.ok) {
          setStatus('error');
          return;
        }
        
        const data = await response.json();
        setMetadata(data);
        setStatus('ready');
      } catch (e) {
        console.error('Load error:', e);
        setStatus('error');
      }
    }
    
    loadMetadata();
  }, [title]);

  const handleOpen = async () => {
    try {
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      
      const response = await fetch(`/api/notes/${id}`);
      
      if (response.status === 404) {
        setStatus('notfound');
        return;
      }
      if (response.status === 410) {
        setStatus('expired');
        return;
      }
      if (!response.ok) {
        setStatus('error');
        return;
      }
      
      const data = await response.json();
      const decrypted = await decryptNote(data.content, key);
      
      setContent(decrypted);
      setStatus('opened');
    } catch (e) {
      console.error('Open error:', e);
      setStatus('error');
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const formatExpiry = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onOpenSidebar} className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden">
            <span className="sr-only">Menu</span>
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/send" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Secret Message</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Encrypted, one-time share</p>
          </div>
        </div>
        <button 
          onClick={onToggleTheme} 
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-lg w-full">
          {/* Creator Banner */}
          {isCreator && status === 'ready' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                <Check className="w-5 h-5" />
                Secret Created!
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                Share this link with someone:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg text-gray-700 dark:text-gray-300 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {metadata?.burnAfterReading && (
                <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Don't open this yourself — it will be deleted!</span>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          )}

          {/* Ready State - Envelope */}
          {status === 'ready' && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Mail className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                You have a secret message
              </h2>
              
              {/* Metadata Info */}
              <div className="space-y-2 mb-6">
                {metadata?.expiresAt && (
                  <p className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    Expires: {formatExpiry(metadata.expiresAt)}
                  </p>
                )}
                {metadata?.burnAfterReading && (
                  <p className="flex items-center justify-center gap-2 text-sm text-red-500 dark:text-red-400 font-medium">
                    <Flame className="w-4 h-4" />
                    This message will be deleted after you open it
                  </p>
                )}
              </div>
              
              <button
                onClick={handleOpen}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                <MailOpen className="w-5 h-5" />
                Open Message
              </button>
            </div>
          )}

          {/* Opened State - Content */}
          {status === 'opened' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 mb-4">
                <MailOpen className="w-8 h-8" />
              </div>
              
              <div className="relative">
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[150px] whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                  {content}
                </div>
                <button
                  onClick={handleCopyContent}
                  className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                </button>
              </div>
              
              {metadata?.burnAfterReading && (
                <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400 text-sm">
                  <Flame className="w-4 h-4" />
                  This message has been deleted from the server
                </div>
              )}
              
              <div className="text-center pt-4">
                <Link
                  to="/send"
                  className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Send className="w-4 h-4" />
                  Create your own secret
                </Link>
              </div>
            </div>
          )}

          {/* Not Found State */}
          {status === 'notfound' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Secret not found
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                This secret may have been deleted or never existed.
              </p>
              <Link
                to="/send"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
                Create a new secret
              </Link>
            </div>
          )}

          {/* Expired State */}
          {status === 'expired' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Secret expired
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                This secret has passed its expiration date.
              </p>
              <Link
                to="/send"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
                Create a new secret
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
