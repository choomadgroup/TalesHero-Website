import { useState, useEffect } from 'react';
import type { NewsCategory } from '@/Lib/newsLoader';

export interface NewsReactions {
  thumbsUp: number;
  heart:    number;
}

export interface ApiNewsArticle {
  _id:          string;
  title:        string;
  slug:         string;
  category:     NewsCategory;
  tags?:        string[];
  excerpt:      string;
  coverUrl?:    string | null;
  readTime?:    number;
  publishedAt?: string;
  createdAt?:   string;
  content?:     string;
  viewCount?:   number;
  reactions?:   NewsReactions;
}

export function useApiNews() {
  const [articles, setArticles] = useState<ApiNewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(r => (r.ok ? r.json() : []))
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return { articles, loading };
}

export function useApiNewsArticle(category: string, slug: string, enabled = true) {
  const [article, setArticle]   = useState<ApiNewsArticle | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    setLoading(true);
    setNotFound(false);
    fetch(`/api/news/${category}/${slug}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => { if (data) setArticle(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [category, slug, enabled]);

  return { article, loading, notFound };
}

/** Fire-and-forget view tracking — returns updated viewCount */
export async function trackView(category: string, slug: string): Promise<number> {
  try {
    const r = await fetch(`/api/news/${category}/${slug}/view`, { method: 'POST' });
    if (!r.ok) return 0;
    const d = await r.json();
    return d.viewCount ?? 0;
  } catch { return 0; }
}

/** Send a reaction (thumbsUp | heart) — returns updated reactions */
export async function sendReaction(
  category: string,
  slug: string,
  type: 'thumbsUp' | 'heart',
): Promise<NewsReactions> {
  try {
    const r = await fetch(`/api/news/${category}/${slug}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    if (!r.ok) return { thumbsUp: 0, heart: 0 };
    const d = await r.json();
    return d.reactions ?? { thumbsUp: 0, heart: 0 };
  } catch { return { thumbsUp: 0, heart: 0 }; }
}
