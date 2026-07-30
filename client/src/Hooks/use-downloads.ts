import { useState, useEffect, useCallback } from 'react';

export interface DownloadPackage {
  id:        'setup' | 'fullclient' | 'patch';
  label:     string;
  desc:      string;
  features:  string[];
  color:     string;
  href:      string;
  size:      string;
  available: boolean;
}

// ── Public hook ───────────────────────────────────────────────────────────────

export function useDownloads() {
  const [packages, setPackages] = useState<DownloadPackage[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/downloads')
      .then(r => (r.ok ? r.json() : []))
      .then(setPackages)
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  return { packages, loading };
}

// ── Admin hooks ───────────────────────────────────────────────────────────────

export function useAdminDownloads() {
  const [packages, setPackages] = useState<DownloadPackage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/admin/downloads');
      if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? 'Error'); }
      setPackages(await r.json());
    } catch (e: any) {
      setError(e.message ?? 'Gagal memuat data download');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (id: string, data: { href?: string; size?: string; available?: boolean }) => {
    const r = await fetch(`/api/admin/downloads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? 'Gagal menyimpan'); }
    const updated: DownloadPackage = await r.json();
    setPackages(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  }, []);

  return { packages, loading, error, refresh: load, update };
}
