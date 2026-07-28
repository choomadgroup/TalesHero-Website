import { useState, useEffect } from 'react';

const REFRESH_MS = 60 * 1000; // refresh tiap 1 menit

export function useOnlineCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.online === 'number') setCount(data.online);
        }
      } catch { /* silent */ }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return count;
}
