import { useState, useEffect, useCallback } from 'react';

export interface AdminNewsArticle {
  _id:          string;
  title:        string;
  slug:         string;
  category:     'update' | 'info' | 'maintenance';
  content:      string;
  excerpt:      string;
  coverUrl?:    string | null;
  readTime?:    number;
  published:    boolean;
  publishedAt?: string | null;
  createdAt?:   string;
  updatedAt?:   string;
}

export interface NewsFormData {
  title:     string;
  slug:      string;
  category:  'update' | 'info' | 'maintenance';
  content:   string;
  excerpt:   string;
  coverUrl:  string;
  published: boolean;
}

// ── Admin auth ────────────────────────────────────────────────────────────────

export function useAdminAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then(r => setAuthenticated(r.ok))
      .catch(() => setAuthenticated(false));
  }, []);

  const login = async (password: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const r = await fetch('/api/admin/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ password }),
      });
      if (r.ok) { setAuthenticated(true); return { ok: true }; }
      const data = await r.json();
      return { ok: false, message: data.message };
    } catch {
      return { ok: false, message: 'Koneksi gagal' };
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAuthenticated(false);
  };

  return { authenticated, login, logout };
}

// ── Admin news CRUD ────────────────────────────────────────────────────────────

export function useAdminNews() {
  const [articles, setArticles] = useState<AdminNewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/news', { credentials: 'include' });
      if (r.ok) setArticles(await r.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (data: NewsFormData) => {
    const r = await fetch('/api/admin/news', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify(data),
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.message); }
    await refresh();
  };

  const update = async (id: string, data: Partial<NewsFormData>) => {
    const r = await fetch(`/api/admin/news/${id}`, {
      method:      'PUT',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify(data),
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.message); }
    await refresh();
  };

  const remove = async (id: string) => {
    const r = await fetch(`/api/admin/news/${id}`, {
      method: 'DELETE', credentials: 'include',
    });
    if (!r.ok) throw new Error('Gagal menghapus artikel');
    await refresh();
  };

  const togglePublish = (a: AdminNewsArticle) =>
    update(a._id, { published: !a.published });

  return { articles, loading, refresh, create, update, remove, togglePublish };
}
