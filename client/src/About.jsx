import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Github } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 md:p-12 transition-colors">
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link to="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notepad
        </Link>
        
        <header className="space-y-4">
          <div className="flex items-center space-x-3">
             <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
             <h1 className="text-4xl font-bold">How SecurePad Works</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Zero-knowledge, real-time collaboration.
          </p>
        </header>

        <section className="prose dark:prose-invert">
          <h3>The Concept</h3>
          <p>
            SecurePad allows you to create instant, encrypted notes just by navigating to a URL. 
            No signups, no passwords, no databases storing your raw text.
          </p>

          <h3>Encryption (The Geeky Stuff)</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>ID Hashing:</strong> The title of your note is hashed using <code>SHA-256</code>. 
              The server only sees this hash (e.g., <code>e3b0c442...</code>), so it never knows the real title.
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
            This project is heavily inspired by the simplicity of 
            <a href="https://github.com/routman/publicnote.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 mx-1">
              publicnote.com <Github className="w-3 h-3"/>
            </a>.
          </p>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
             <span>Built with ❤️ by <strong>JBot</strong></span>
             <span>v1.0.0</span>
          </div>
        </section>
      </div>
    </div>
  );
}
