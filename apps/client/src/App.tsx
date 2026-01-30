import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import Sidebar from './Sidebar';
import Header from './components/Header';
import useTheme from './hooks/useTheme';
import useStarredNotes from './hooks/useStarredNotes';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import NotePage from './pages/NotePage';
import SendComposePage from './pages/SendComposePage';
import SendViewPage from './pages/SendViewPage';

function AppContent() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { starred, isStarred, toggle: toggleStar, clear: clearStarred } = useStarredNotes();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noteStatus, setNoteStatus] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const commonProps = {
    onOpenSidebar: () => setSidebarOpen(true),
    theme,
    onToggleTheme: toggleTheme,
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950 transition-colors">
      <Toaster
        position="top-center"
        richColors
        theme={theme as 'light' | 'dark'}
        toastOptions={{
          className: 'font-sans',
        }}
      />
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        starred={starred}
        onClearStarred={clearStarred}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          isStarred={isStarred}
          onToggleStar={toggleStar}
          status={noteStatus}
        />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/send" element={<SendComposePage />} />
          <Route path="/send/:uuid" element={<SendViewPage />} />
          <Route
            path="/:title"
            element={
              <NotePage
                onStatusChange={setNoteStatus}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
