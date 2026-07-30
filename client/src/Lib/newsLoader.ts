/**
 * newsLoader.ts — shared news constants/types.
 * MDX system has been removed; articles are now served from MongoDB via /api/news.
 * The renderMarkdown and formatDate helpers live in @/Lib/markdown.
 */

export type NewsCategory = 'update' | 'info' | 'maintenance';

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  update:      'Pembaruan',
  info:        'Informasi',
  maintenance: 'Pemeliharaan',
};

export const CATEGORY_COLORS: Record<NewsCategory, string> = {
  update:      '#22c55e',
  info:        '#3b82f6',
  maintenance: '#f59e0b',
};

export { formatDate } from '@/Lib/markdown';
