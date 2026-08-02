import { useState, useEffect } from 'react';

export type ServerStatusValue = 'online' | 'offline' | 'maintenance' | null;

export interface ServerStatusData {
  status:      ServerStatusValue;
  onlineCount: number;
}

const REFRESH_MS = 30_000; // poll tiap 30 detik

export function useServerStatus(): ServerStatusData {
  const [data, setData] = useState<ServerStatusData>({ status: null, onlineCount: 0 });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats/server-status');
        if (res.ok) {
          const d = await res.json();
          setData({
            status:      d.status      ?? null,
            onlineCount: d.onlineCount ?? 0,
          });
        }
      } catch { /* silent */ }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return data;
}
