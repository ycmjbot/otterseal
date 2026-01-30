import { useState, useEffect } from 'react';

interface StarredNote {
  title: string;
}

export default function useStarredNotes() {
  const [starred, setStarred] = useState<StarredNote[]>(() => {
    try {
      const saved = localStorage.getItem('starred');
      if (!saved) return [];
      const parsed = JSON.parse(saved) as unknown;
      // Compatibility with old array of strings
      if (Array.isArray(parsed)) {
        if (typeof parsed[0] === 'string') {
          return parsed.map((title: string) => ({ title }));
        }
        return parsed as StarredNote[];
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('starred', JSON.stringify(starred));
  }, [starred]);

  const isStarred = (title: string) => starred.some(s => s.title === title);
  
  const toggle = (title: string) => {
    setStarred(prev => 
      isStarred(title)
        ? prev.filter(t => t.title !== title)
        : [...prev, { title }]
    );
  };

  const clear = () => setStarred([]);

  return { starred, isStarred, toggle, clear };
}
