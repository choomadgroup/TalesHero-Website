---
name: Tales Hero admin dashboard
description: Admin news dashboard architecture — what was built, what still needs activation
---

## What was built
- `server/mongodb.js` — mongoose connection, gracefully no-ops if MONGODB_URI missing
- `server/models/news-article.js` — mongoose schema (title, slug, category, content, excerpt, coverUrl, readTime, published, publishedAt)
- `server/news.js` — public GET /api/news + /api/news/:cat/:slug; admin CRUD at /api/admin/news; admin auth at /api/admin/login|logout|me
- `server/admin-session.js` — HMAC-signed cookie `th_admin`, 8h TTL, uses SESSION_SECRET
- `client/src/Hooks/use-admin-news.ts` — useAdminAuth + useAdminNews hooks
- `client/src/Hooks/use-news.ts` — useApiNews + useApiNewsArticle for public consumption
- `client/src/Style/admin.scss` — full admin UI styles
- `client/src/Pages/Admin.tsx` — complete admin UI (login gate → dashboard → article list + editor with markdown preview)
- Route `/admin` added to `client/src/App.tsx`
- API routes wired in both `vite.config.ts` (dev) and `server/index.js` (prod)

## What needs activation before articles persist
1. Set `MONGODB_URI` secret → a free MongoDB Atlas cluster works
2. Set `ADMIN_PASSWORD` secret → any strong password
3. Without these, admin dashboard loads but articles cannot be saved (503 from API)

**Why:** MongoDB connection is intentionally lazy/optional so missing MONGODB_URI never crashes startup.

## MDX system fully removed (2026-07-30)
- All MDX files deleted (`client/src/Data/News/`)
- `@mdx-js/rollup`, `remark-frontmatter`, `remark-gfm`, `remark-mdx-frontmatter` removed from package.json + vite.config.ts
- `newsLoader.ts` now only exports constants/types (CATEGORY_LABELS, CATEGORY_COLORS, NewsCategory, formatDate)
- `formatDate` + `renderMarkdown` shared via `client/src/Lib/markdown.ts`
- `NewsListPage.tsx` → uses `useApiNews()` hook, Grid layout with featured top card + nl-grid
- `NewsArticlePage.tsx` → uses `useApiNewsArticle()` hook, renders markdown via `renderMarkdown()`
- `Announcement.tsx` → uses `useApiNews()` hook (was using static `allArticles`)

## Admin protection added
- `/admin` added to `privatePagePath` regex in `server/index.js` → X-Robots-Tag: noindex, nofollow
- Rate limiting on `/api/admin/login`: max 10 req / 15 min / IP (in-memory, server/index.js)
