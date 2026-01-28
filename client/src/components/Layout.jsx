import React from 'react';

/**
 * Simple content wrapper - header is now in App.jsx
 */
export default function Layout({
  children,
  centerContent = false,
  maxWidth = 'max-w-4xl',
}) {
  return (
    <main className={`flex-1 relative p-4 md:p-8 ${maxWidth} md:mx-auto w-full ${centerContent ? 'flex items-center justify-center' : ''}`}>
      {children}
    </main>
  );
}
