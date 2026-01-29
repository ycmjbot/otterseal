import { useState, useEffect } from 'react';

export default function useStarredNotes() {
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

  const clear = () => setStarred([]);

  return { starred, isStarred, toggle, clear };
}
