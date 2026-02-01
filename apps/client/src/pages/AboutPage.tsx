import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Send, Shield, EyeOff, Key, Server } from 'lucide-react';
import Layout from '../components/Layout';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <Layout maxWidth="max-w-2xl">
      <div className="prose dark:prose-invert py-4 px-0 md:px-0">
        <div className="flex items-center gap-3 mb-6 not-prose">
          <Lock className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white m-0">How OtterSeal Works</h2>
        </div>
        <p className="lead text-base md:text-lg">Zero-knowledge encryption — your secrets stay yours, always.</p>

        <h3 className="text-lg md:text-xl">📝 Encrypted Notes</h3>
        <p className="text-sm md:text-base">
          Create instant encrypted notes just by typing a title. No signups, no passwords, no server storing your raw text.
        </p>

        <div className="not-prose bg-gray-100 dark:bg-gray-800 rounded-xl p-4 md:p-5 my-5 -mx-2 md:mx-0">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm md:text-base">
            <Key className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            How Your Title Becomes Your Key
          </h4>
          <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center mt-0.5">1</span>
              <span className="min-w-0 break-words">You type a title (e.g., "My Secret Recipe")</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center mt-0.5">2</span>
              <span className="min-w-0 break-words">Your browser uses <strong>HKDF</strong> (a cryptographic key derivation function) to create <em>two separate values</em> from your title</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center mt-0.5">3</span>
              <div className="min-w-0 break-words">
                <strong>Note ID</strong> → sent to the server as a public identifier<br/>
                <strong>Encryption Key</strong> → stays in your browser, never transmitted
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center mt-0.5">4</span>
              <span className="min-w-0 break-words">Your content is encrypted with <strong>AES-256-GCM</strong> before leaving your device</span>
            </li>
          </ol>
        </div>

        <ul className="text-sm md:text-base">
          <li><strong>Real-Time Sync:</strong> Share the title with others to collaborate instantly. Anyone with the title can decrypt.</li>
          <li><strong>Zero Knowledge:</strong> The server only sees an encrypted blob — it cannot read your notes, even if compelled.</li>
        </ul>

        <h3 className="text-lg md:text-xl">🔐 Send a Secret</h3>
        <p className="text-sm md:text-base">
          Need to share a password, API key, or sensitive message? <strong>Send</strong> creates 
          a one-time, self-destructing secret link.
        </p>

        <div className="not-prose bg-gray-100 dark:bg-gray-800 rounded-xl p-4 md:p-5 my-5 -mx-2 md:mx-0">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm md:text-base">
            <EyeOff className="w-4 h-4 text-purple-500 flex-shrink-0" />
            The URL Contains the Key
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            When you create a secret, the decryption key is embedded directly in the URL fragment (the part after <code className="break-all">#</code>):
          </p>
          <div className="bg-gray-900 text-gray-100 p-3 rounded-lg mb-3 overflow-hidden">
            <code className="text-xs block break-all">
              https://otterseal.ycmj.bot/s/abc123#encryption-key-here
            </code>
          </div>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li className="flex gap-2 items-start">
              <Server className="w-4 h-4 flex-shrink-0 text-gray-500 mt-0.5" />
              <span className="min-w-0 break-words">The server sees <code>/s/abc123</code> — just a lookup ID</span>
            </li>
            <li className="flex gap-2 items-start">
              <Shield className="w-4 h-4 flex-shrink-0 text-green-500 mt-0.5" />
              <span className="min-w-0 break-words">The <code className="break-all">#encryption-key-here</code> never leaves your browser — it's not sent to any server</span>
            </li>
          </ul>
        </div>

        <ul className="text-sm md:text-base">
          <li><strong>Expiring Links:</strong> Set secrets to expire after 1 hour, 1 day, 7 days, or 30 days.</li>
          <li><strong>Burn After Reading:</strong> Optionally delete the secret immediately after it's opened once.</li>
          <li><strong>No Server Access:</strong> Even OtterSeal's server cannot decrypt your secrets — the key never reaches us.</li>
        </ul>
        
        <div className="not-prose my-6">
          <button
            onClick={() => navigate('/send')}
            className="inline-flex items-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all text-sm md:text-base w-full md:w-auto justify-center"
          >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
            Try Send a Secret
          </button>
        </div>

        <h3 className="text-lg md:text-xl">🔒 Security Guarantees</h3>
        <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 my-5">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 md:p-4">
            <h4 className="font-semibold text-green-800 dark:text-green-400 text-xs md:text-sm mb-1">What We Store</h4>
            <ul className="text-xs md:text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>✓ Encrypted blobs (indecipherable without keys)</li>
              <li>✓ Expiration timestamps</li>
              <li>✓ Public note IDs only</li>
            </ul>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 md:p-4">
            <h4 className="font-semibold text-red-800 dark:text-red-400 text-xs md:text-sm mb-1">What We Never See</h4>
            <ul className="text-xs md:text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>✗ Your titles or passwords</li>
              <li>✗ Your note content</li>
              <li>✗ Encryption keys (ever)</li>
            </ul>
          </div>
        </div>

        <h3 className="text-lg md:text-xl">🔧 Technical Details</h3>
        <ul className="text-sm md:text-base">
          <li>
            <strong>HKDF-SHA256:</strong> We use HMAC-based Extract-and-Expand Key Derivation Function for cryptographically secure domain separation.
          </li>
          <li>
            <strong>Independent Derivation:</strong> The Note ID and Encryption Key are mathematically unrelated — knowing one reveals nothing about the other.
          </li>
          <li>
            <strong>AES-256-GCM:</strong> Industry-standard authenticated encryption with 256-bit keys and built-in integrity checking.
          </li>
          <li>
            <strong>Client-Side Only:</strong> All encryption and decryption happens in your browser. Our server is just a dumb encrypted blob store.
          </li>
        </ul>
        
        <hr />
        <p className="text-xs md:text-sm text-gray-500 text-center">
          Built with ❤️ by <strong>JBot</strong> • v2026.01.30
        </p>
      </div>
    </Layout>
  );
}
