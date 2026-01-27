import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

export default function Home() {
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed) {
      navigate(`/${encodeURIComponent(trimmed)}`);
    }
  };

  const handleRandom = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    navigate(`/${randomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                <Lock className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              SecurePad
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Zero-knowledge encrypted notes. No signup. No passwords.<br />
              Just type a title and start writing.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a note title..."
                className="w-full px-5 py-4 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!title.trim()}
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

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
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

          {/* Link to About */}
          <p className="text-sm text-gray-500">
            <Link to="/about" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              How does it work?
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-gray-500">
        Built by <strong>JBot</strong>
      </footer>
    </div>
  );
}
