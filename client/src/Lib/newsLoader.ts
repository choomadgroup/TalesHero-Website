import { marked } from 'marked';

export type NewsCategory = 'update' | 'info' | 'maintenance';

export interface NewsArticle {
    slug: string;
    category: NewsCategory;
    title: string;
    date: string;
    excerpt: string;
    rawContent: string;
}

// ── Frontmatter parser ──────────────────────────────────────────────
function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, content: raw };
    const meta: Record<string, string> = {};
    match[1].split('\n').forEach(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim();
            const val = line.slice(colonIdx + 1).trim();
            meta[key] = val;
        }
    });
    return { meta, content: match[2] };
}

// ── Folder name → category key mapping ─────────────────────────────
const FOLDER_TO_CATEGORY: Record<string, NewsCategory> = {
    Update:      'update',
    Information: 'info',
    Maintenance: 'maintenance',
};

// ── Vite glob — eager load all .md files as raw strings ────────────
const rawFiles = import.meta.glob('../Data/News/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

// ── Build article list from glob ────────────────────────────────────
function buildArticleList(): NewsArticle[] {
    const articles: NewsArticle[] = [];

    for (const [filePath, rawContent] of Object.entries(rawFiles)) {
        // filePath: ../Data/News/Update/2026-07-20-server-perdana.md
        const parts = filePath.split('/');
        const folderName = parts[parts.length - 2];
        const category = FOLDER_TO_CATEGORY[folderName] ?? (folderName.toLowerCase() as NewsCategory);
        const fileName = parts[parts.length - 1];
        const slug = fileName.replace(/\.md$/, '');

        const { meta, content } = parseFrontmatter(rawContent);

        articles.push({
            slug,
            category,
            title:   meta.title   ?? slug,
            date:    meta.date    ?? '',
            excerpt: meta.excerpt ?? '',
            rawContent: content,
        });
    }

    // Sort by date desc
    return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const allArticles: NewsArticle[] = buildArticleList();

export function getArticle(category: NewsCategory, slug: string): NewsArticle | undefined {
    return allArticles.find(a => a.category === category && a.slug === slug);
}

// ── Markdown → HTML ─────────────────────────────────────────────────
marked.setOptions({ breaks: true });

export function renderMarkdown(content: string): string {
    return marked.parse(content) as string;
}

// ── Category helpers ─────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<NewsCategory, string> = {
    update:      'Update',
    info:        'Info',
    maintenance: 'Maintenance',
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
