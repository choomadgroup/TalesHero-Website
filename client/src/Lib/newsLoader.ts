import { ComponentType } from 'react';

export type NewsCategory = 'update' | 'info' | 'maintenance';

export interface NewsArticle {
    slug:       string;
    category:   NewsCategory;
    title:      string;
    date:       string;
    excerpt:    string;
    cover?:     string;
    readTime?:  number;
    component:  ComponentType;
}

// ── Folder name → category key ──────────────────────────────────────
const FOLDER_TO_CATEGORY: Record<string, NewsCategory> = {
    Update:      'update',
    Information: 'info',
    Maintenance: 'maintenance',
};

// ── MDX glob — each module exports default (component) + frontmatter ─
const modules = import.meta.glob('../Data/News/**/*.mdx', { eager: true }) as Record<string, {
    default:     ComponentType;
    frontmatter: { title?: string; date?: string; excerpt?: string; cover?: string; readTime?: string };
}>;

// ── Build article list ───────────────────────────────────────────────
function buildArticleList(): NewsArticle[] {
    const articles: NewsArticle[] = [];

    for (const [filePath, mod] of Object.entries(modules)) {
        const parts       = filePath.split('/');
        const folderName  = parts[parts.length - 2];
        const category    = FOLDER_TO_CATEGORY[folderName] ?? (folderName.toLowerCase() as NewsCategory);
        const slug        = parts[parts.length - 1].replace(/\.mdx$/, '');
        const fm          = mod.frontmatter ?? {};

        articles.push({
            slug,
            category,
            title:     fm.title    ?? slug,
            date:      fm.date     ?? '',
            excerpt:   fm.excerpt  ?? '',
            cover:     fm.cover,
            readTime:  fm.readTime ? Number(fm.readTime) : undefined,
            component: mod.default,
        });
    }

    return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const allArticles: NewsArticle[] = buildArticleList();

export function getArticle(category: NewsCategory, slug: string): NewsArticle | undefined {
    return allArticles.find(a => a.category === category && a.slug === slug);
}

// ── Category helpers ─────────────────────────────────────────────────
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

export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
