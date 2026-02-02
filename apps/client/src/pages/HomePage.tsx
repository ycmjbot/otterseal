import { ArrowRight, Lock, Send, Shield, Sparkles, Zap } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function HomePage() {
  const [inputTitle, setInputTitle] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputTitle.trim();
    if (trimmed) {
      navigate(`/${encodeURIComponent(trimmed)}`);
    }
  };

  const handleRandom = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    navigate(`/${randomId}`);
  };

  return (
    <Layout centerContent maxWidth="max-w-xl">
      <div className="w-full space-y-8 text-center py-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <img src="/otterseal-logo.png" alt="OtterSeal" className="w-24 h-24" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Welcome to OtterSeal
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Zero-knowledge encrypted notes. No signup. No passwords.
            <br />
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
            onChange={e => setInputTitle(e.target.value)}
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

        <div className="pt-2">
          <button
            onClick={() => navigate('/send')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
            Send a One-Time Secret
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Share an encrypted, self-destructing message
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left">
            <Shield className="w-6 h-6 text-green-500 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">End-to-End Encrypted</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AES-256 encryption. Server never sees your content.
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left">
            <Zap className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Real-Time Sync</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share the title. Collaborate instantly.
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-left">
            <Lock className="w-6 h-6 text-indigo-500 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Zero Knowledge</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Title = password. We can't recover it.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
