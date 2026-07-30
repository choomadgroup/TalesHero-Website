import { useState, useEffect } from 'react';
import type { NewsCategory } from '@/Lib/newsLoader';

export interface ApiNewsArticle {
  _id:          string;
  title:        string;
  slug:         string;
  category:     NewsCategory;
  excerpt:      string;
  coverUrl?:    string | null;
  readTime?:    number;
  publishedAt?: string;
  createdAt?:   string;
  content?:     string;
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
