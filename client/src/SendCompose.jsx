import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hashTitle, deriveKey, encryptNote } from './cryptoUtils';
import { Send, Clock, Flame, Loader2, Moon, Sun } from 'lucide-react';

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '1 day', value: 24 * 60 * 60 * 1000 },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Never', value: null },
];

export default function SendCompose({ theme, onToggleTheme, onOpenSidebar }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [expiryValue, setExpiryValue] = useState(24 * 60 * 60 * 1000); // Default: 1 day
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    if (!message.trim()) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      // Generate UUIDv4
      const uuid = crypto.randomUUID();
      const title = `/send/${uuid}`;
      
      // Derive ID and key from the full title (including /send/ prefix)
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      
      // Encrypt the message
      const encrypted = await encryptNote(message, key);
      
      // Calculate expiry timestamp
      const expiresAt = expiryValue ? Date.now() + expiryValue : null;
      
      // Send to server
      const response = await fetch(`/api/notes/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: encrypted,
          expiresAt,
          burnAfterReading,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create secret');
      }
      
      // Navigate to the view page with state instead of query param
      navigate(`/send/${uuid}`, { state: { created: true } });
    } catch (e) {
      console.error('Create error:', e);
      setError('Failed to create secret. Please try again.');
      setIsCreating(false);
    }
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
          <Send className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Create Secret</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Share an encrypted, self-destructing message</p>
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

      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* Message Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secret Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your secret message here..."
              rows={8}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors resize-none"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {message.length.toLocaleString()} characters
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiry */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="w-4 h-4" />
                Expires After
              </label>
              <select
                value={expiryValue || ''}
                onChange={(e) => setExpiryValue(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.value || ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Burn After Reading */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flame className="w-4 h-4" />
                Self-Destruct
              </label>
              <button
                type="button"
                onClick={() => setBurnAfterReading(!burnAfterReading)}
                className={`w-full px-4 py-3 border-2 rounded-xl font-medium transition-all ${
                  burnAfterReading
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {burnAfterReading ? '🔥 Delete after opening' : 'Keep after opening'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={!message.trim() || isCreating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Create Secret Link
              </>
            )}
          </button>

          {/* Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>🔒 Zero-Knowledge:</strong> Your message is encrypted in your browser. The server never sees the content.</p>
            <p><strong>🔗 Shareable Link:</strong> The decryption key is in the URL itself — only people with the link can read it.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
