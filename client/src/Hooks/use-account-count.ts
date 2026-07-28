import { useState, useEffect } from 'react';

const REFRESH_MS = 5 * 60 * 1000; // refresh tiap 5 menit

export function useAccountCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.accounts === 'number') setCount(data.accounts);
        }
      } catch { /* silent */ }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return count;
}
