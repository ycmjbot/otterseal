import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Send } from 'lucide-react';
import Layout from '../components/Layout';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <Layout maxWidth="max-w-2xl">
      <div className="prose dark:prose-invert py-4">
        <div className="flex items-center gap-3 mb-6 not-prose">
          <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white m-0">How SecurePad Works</h2>
        </div>
        <p className="lead">Zero-knowledge encryption for notes and secrets.</p>

        <h3>📝 Encrypted Notes</h3>
        <p>
          Create instant, encrypted notes just by typing a title. 
          No signups, no passwords, no databases storing your raw text.
        </p>
        <ul>
          <li><strong>Title = Password:</strong> Your note title is used to derive the encryption key.</li>
          <li><strong>Real-Time Sync:</strong> Share the title with others to collaborate instantly.</li>
          <li><strong>Zero Knowledge:</strong> The server only stores encrypted blobs — we can't read your notes.</li>
        </ul>

        <h3>🔐 Send a Secret</h3>
        <p>
          Need to share a password, API key, or sensitive message? Use <strong>Send</strong> to create 
          a one-time, self-destructing secret link.
        </p>
        <ul>
          <li><strong>Expiring Links:</strong> Set secrets to expire after 1 hour, 1 day, 7 days, or 30 days.</li>
          <li><strong>Burn After Reading:</strong> Optionally delete the secret after it's opened once.</li>
          <li><strong>Shareable URL:</strong> The decryption key is embedded in the link — only people with the link can read it.</li>
        </ul>
        
        <div className="not-prose my-6">
          <button
            onClick={() => navigate('/send')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all"
          >
            <Send className="w-5 h-5" />
            Try Send a Secret
          </button>
        </div>

        <h3>🔧 The Geeky Stuff</h3>
        <ul>
          <li>
            <strong>ID Hashing:</strong> Titles are hashed using <code>SHA-256</code>. 
            The server only sees this hash, never the real title.
          </li>
          <li>
            <strong>Client-Side Encryption:</strong> Content is encrypted in your browser using <code>AES-256-GCM</code>.
          </li>
          <li>
            <strong>No Server Decryption:</strong> The server receives only encrypted blobs and cannot recover your data.
          </li>
        </ul>
        
        <hr />
        <p className="text-sm text-gray-500 text-center">
          Built with ❤️ by <strong>JBot</strong> • v1.1.0
        </p>
      </div>
    </Layout>
  );
}
