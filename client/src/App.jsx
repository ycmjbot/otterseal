import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Note from './Note';
import Sidebar from './Sidebar';

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') };
}

function useStarredNotes() {
  const [starred, setStarred] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starred') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('starred', JSON.stringify(starred));
  }, [starred]);

  const isStarred = (title) => starred.includes(title);
  const toggle = (title) => {
    setStarred(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return { starred, isStarred, toggle };
}

function AppContent() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { starred, isStarred, toggle: toggleStar } = useStarredNotes();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950 transition-colors">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        starred={starred}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Routes>
          <Route 
            path="/" 
            element={
              <Note 
                isStarred={isStarred}
                onToggleStar={toggleStar}
                onOpenSidebar={() => setSidebarOpen(true)}
                theme={theme}
                onToggleTheme={toggleTheme}
                isHomePage={true}
              />
            } 
          />
          <Route 
            path="/about" 
            element={
              <Note 
                isStarred={isStarred}
                onToggleStar={toggleStar}
                onOpenSidebar={() => setSidebarOpen(true)}
                theme={theme}
                onToggleTheme={toggleTheme}
                isHomePage={false}
                isAboutPage={true}
              />
            } 
          />
          <Route 
            path="/:title" 
            element={
              <Note 
                isStarred={isStarred}
                onToggleStar={toggleStar}
                onOpenSidebar={() => setSidebarOpen(true)}
                theme={theme}
                onToggleTheme={toggleTheme}
                isHomePage={false}
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
