import clsx from 'clsx';
import { BookOpen, Github, Home, Send, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface StarredNote {
  title: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  starred: StarredNote[];
  onClearStarred: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export default function Sidebar({ isOpen, onClose, starred, onClearStarred }: SidebarProps) {
  const { title: currentTitle } = useParams();
  const safeCurrentTitle = decodeURIComponent(currentTitle || '');

  return (
    <>
      {/* Overlay - only on mobile */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Sidebar - slide-out on mobile, always visible on lg+ */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl',
          'lg:translate-x-0 lg:shadow-none', // Always visible on lg+
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white hover:opacity-75 transition-opacity"
          >
            <img src="/otterseal-logo.png" alt="OtterSeal" className="w-10 h-10" />
            <span>OtterSeal</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Navigation */}
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => onClose()}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/send"
              onClick={() => onClose()}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send a Secret
            </Link>
            <Link
              to="/about"
              onClick={() => onClose()}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              How it Works
            </Link>
            <a
              href="https://github.com/routman/publicnote.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Github className="w-4 h-4" />
              Inspiration
            </a>
          </div>

          {/* Starred */}
          <div>
            <div className="flex items-center justify-between mb-2 px-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Starred Pages
              </h3>
              {starred.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all starred pages?')) {
                      onClearStarred();
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {starred.length === 0 ? (
              <p className="px-3 text-sm text-gray-500 italic">No starred pages yet.</p>
            ) : (
              <ul className="space-y-1">
                {starred.map(s => (
                  <li key={s.title}>
                    <Link
                      to={`/${encodeURIComponent(s.title)}`}
                      onClick={() => onClose()}
                      className={clsx(
                        'group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors truncate',
                        safeCurrentTitle === s.title
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                      )}
                    >
                      <span className="truncate">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 text-center">
          <p>
            Built by{' '}
            <a
              href="https://ycmj.bot"
              target="_blank"
              rel="noreferrer"
              className="font-semibold hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              JBot
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
