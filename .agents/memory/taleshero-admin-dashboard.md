---
name: Tales Hero admin dashboard
description: Admin news dashboard architecture — what was built, what still needs activation
---

## What was built
- `server/mongodb.js` — mongoose connection, gracefully no-ops if MONGODB_URI missing
- `server/models/news-article.js` — mongoose schema (title, slug, category, tags[], content, excerpt, coverUrl, readTime, published, publishedAt, viewCount, reactions{thumbsUp,heart})
- `server/news.js` — public GET /api/news + /api/news/:cat/:slug; POST /api/news/:cat/:slug/view (view tracking); POST /api/news/:cat/:slug/react (thumbsUp|heart); admin CRUD at /api/admin/news; admin auth at /api/admin/login|logout|me
- `server/admin-session.js` — HMAC-signed cookie `th_admin`, 8h TTL, uses SESSION_SECRET
- `client/src/Hooks/use-admin-news.ts` — useAdminAuth + useAdminNews hooks
- `client/src/Hooks/use-news.ts` — useApiNews + useApiNewsArticle + trackView() + sendReaction()
- `client/src/Style/admin.scss` — full admin UI styles
- `client/src/Pages/Admin.tsx` — complete admin UI (login gate → dashboard → article list + editor with markdown preview)
- Route `/admin` added to `client/src/App.tsx`
- API routes wired in both `vite.config.ts` (dev) and `server/index.js` (prod)

## Blog-style features added (2026-07-30)
- **Tags**: free-form string array per article; shown as pills on article page and card grid
- **View count**: POST /:cat/:slug/view increments atomically; shown on article page with eye icon
- **Reactions**: thumbsUp + heart; POST /:cat/:slug/react; localStorage prevents duplicate from same browser
- **Share panel**: copy link, WhatsApp, Twitter/X buttons at bottom of each article
- `client/src/mdx.d.ts` deleted (MDX remnant)

## Download page redesign (2026-07-30)
- Replaced single "Coming Soon" banner with 3 package cards: File Setup (active, href='#' placeholder), Full Client (coming soon), Manual Patch (coming soon)
- CSS class `.dl-pkg-card` with `--pkg-color` CSS variable per package
- To activate File Setup download: update `href` in `PACKAGES[0]` in `client/src/Pages/Download.tsx`

## What needs activation before articles persist
1. Set `MONGODB_URI` secret → a free MongoDB Atlas cluster works
2. Set `ADMIN_PASSWORD` secret → any strong password
3. Without these, admin dashboard loads but articles cannot be saved (503 from API)

**Why:** MongoDB connection is intentionally lazy/optional so missing MONGODB_URI never crashes startup.

## Admin protection added
- `/admin` added to `privatePagePath` regex in `server/index.js` → X-Robots-Tag: noindex, nofollow
- Rate limiting on `/api/admin/login`: max 10 req / 15 min / IP (in-memory, server/index.js)
