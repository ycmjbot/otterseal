import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hashTitle, deriveKey, encryptNote } from '@otterseal/core';
import { Send, Clock, Flame, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '1 day', value: 24 * 60 * 60 * 1000 },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Never', value: null },
];

export default function SendComposePage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [expiryValue, setExpiryValue] = useState<number | null>(24 * 60 * 60 * 1000);
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!message.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const uuid = crypto.randomUUID();
      const title = `/send/${uuid}`;
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      const encrypted = await encryptNote(message, key);
      const expiresAt = expiryValue ? Date.now() + expiryValue : null;

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

      navigate(`/send/${uuid}`, { state: { created: true } });
    } catch (e) {
      console.error('Create error:', e);
      setError('Failed to create secret. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <Layout maxWidth="max-w-2xl">
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4" />
              Expires After
            </label>
            <select
              value={expiryValue ?? ''}
              onChange={(e) => setExpiryValue(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
            >
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value ?? ''}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

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

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

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
      </div>
    </Layout>
  );
}
