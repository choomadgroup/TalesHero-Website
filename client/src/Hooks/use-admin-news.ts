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

export interface AdminUser {
  username: string;
  nickname: string;
  role:     string;
  userNum:  number;
}

// ── Admin auth ────────────────────────────────────────────────────────────────

export function useAdminAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser]         = useState<AdminUser | null>(null);

  useEffect(() => {
    fetch('/api/admin/me', { credentials: 'include' })
      .then(async r => {
        if (r.ok) {
          const data = await r.json();
          setAuthenticated(true);
          setAdminUser(data.user ?? null);
        } else {
          setAuthenticated(false);
          setAdminUser(null);
        }
      })
      .catch(() => { setAuthenticated(false); setAdminUser(null); });
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const r = await fetch('/api/admin/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ username, password }),
      });
      if (r.ok) {
        const data = await r.json();
        setAuthenticated(true);
        setAdminUser(data.user ?? null);
        return { ok: true };
      }
      const data = await r.json();
      return { ok: false, message: data.message };
    } catch {
      return { ok: false, message: 'Koneksi gagal' };
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAuthenticated(false);
    setAdminUser(null);
  };

  return { authenticated, adminUser, login, logout };
}

// ── Admin news CRUD ────────────────────────────────────────────────────────────

export function useAdminNews() {
  const [articles, setArticles] = useState<AdminNewsArticle[]>([]);
  const [loading,  setLoading]  = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/news', { credentials: 'include' });
      if (r.ok) setArticles(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (data: NewsFormData, asDraft: boolean) => {
    const r = await fetch('/api/admin/news', {
      method:  'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...data, published: !asDraft }),
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? 'Gagal membuat artikel'); }
    const article: AdminNewsArticle = await r.json();
    setArticles(prev => [article, ...prev]);
    return article;
  };

  const update = async (id: string, data: NewsFormData, asDraft: boolean) => {
    const r = await fetch(`/api/admin/news/${id}`, {
      method:  'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...data, published: !asDraft }),
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? 'Gagal memperbarui'); }
    const article: AdminNewsArticle = await r.json();
    setArticles(prev => prev.map(a => a._id === id ? article : a));
    return article;
  };

  const remove = async (id: string) => {
    const r = await fetch(`/api/admin/news/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? 'Gagal menghapus'); }
    setArticles(prev => prev.filter(a => a._id !== id));
  };

  const togglePublish = async (article: AdminNewsArticle) => {
    const r = await fetch(`/api/admin/news/${article._id}/publish`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ published: !article.published }),
    });
    if (!r.ok) { const d = await r.json(); throw new Error(d.message ?? 'Gagal mengubah status'); }
    const updated: AdminNewsArticle = await r.json();
    setArticles(prev => prev.map(a => a._id === article._id ? updated : a));
    return updated;
  };

  return { articles, loading, refresh, create, update, remove, togglePublish };
}
