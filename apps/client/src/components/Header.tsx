import clsx from 'clsx';
import { Check, ListIcon, Loader2, Moon, Star, Sun, WifiOff } from 'lucide-react';
import type React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenSidebar: () => void;
  theme: string;
  onToggleTheme: () => void;
  isStarred: (title: string) => boolean;
  onToggleStar: (title: string) => void;
  status: string | null;
  leftActions?: React.ReactNode;
}

export default function Header({
  onOpenSidebar,
  theme,
  onToggleTheme,
  isStarred,
  onToggleStar,
  status,
  leftActions,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTitle = (() => {
    const path = location.pathname;
    if (path === '/') return '';
    if (path === '/about') return 'About';
    if (path === '/send') return 'Send';
    if (path.startsWith('/send/')) return 'Send';

    // For note pages, take everything after the first slash
    return decodeURIComponent(path.slice(1));
  })();

  const handleTitleChange = (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      navigate('/');
    } else if (trimmed.toLowerCase() === 'about') {
      navigate('/about');
    } else if (trimmed.toLowerCase() === 'send') {
      navigate('/send');
    } else {
      navigate(`/${encodeURIComponent(newTitle)}`);
    }
  };

  const isNotePage =
    location.pathname !== '/' &&
    location.pathname !== '/about' &&
    location.pathname !== '/send' &&
    !location.pathname.startsWith('/send/');

  const showStar = isNotePage && currentTitle;

  const statusIndicator = status && (
    <div className="flex items-center space-x-2 text-sm font-medium">
      {status === 'connecting' && (
        <span className="text-yellow-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="hidden sm:inline">Connecting</span>
        </span>
      )}
      {status === 'saving' && (
        <span className="text-blue-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="hidden sm:inline">Saving</span>
        </span>
      )}
      {status === 'saved' && (
        <span className="text-green-500 flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span className="hidden sm:inline">Saved</span>
        </span>
      )}
      {status === 'error' && (
        <span className="text-red-500 flex items-center gap-1">
          <WifiOff className="w-3 h-3" />
          <span className="hidden sm:inline">Offline</span>
        </span>
      )}
    </div>
  );

  const getSubtitle = () => {
    if (location.pathname === '/') return 'Type a title to open or create a note';
    if (isNotePage) return 'Click title to rename • Changes URL';
    return null;
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
        >
          <span className="sr-only">Menu</span>
          <ListIcon />
        </button>

        {leftActions}

        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-2">
            <input
              type="text"
              name="global-title-header"
              autoComplete="off"
              spellCheck="false"
              value={currentTitle}
              placeholder="Enter a note title..."
              onChange={e => handleTitleChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-ring outline-none max-w-[300px] truncate transition-colors placeholder-gray-400"
            />
            {showStar && (
              <button
                type="button"
                onClick={() => onToggleStar(currentTitle)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Star
                  className={clsx(
                    'w-4 h-4',
                    isStarred(currentTitle) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400',
                  )}
                />
              </button>
            )}
          </div>
          {getSubtitle() && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
              {getSubtitle()}
            </p>
          )}
        </div>

        {statusIndicator && (
          <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-3 ml-2">
            {statusIndicator}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </header>
  );
}
