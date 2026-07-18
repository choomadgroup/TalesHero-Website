# Tales Hero Indonesia

Website game online action adventure Tales Hero Indonesia — landing page + halaman pendaftaran hero.

## Run & Operate

- `client: web` workflow — jalankan dev server (port dari env `PORT`)
- `pnpm run typecheck` — typecheck seluruh project

## Stack

- pnpm workspaces, Node.js 20, TypeScript
- Frontend: React 19 + Vite 7, wouter (routing), react-scroll (smooth scroll), react-icons, Sass
- API routes: inline Vite middleware di `vite.config.ts` (dev only)
- No database saat ini — data leaderboard hardcoded, form contact validasi saja

## Where things live

- `client/src/Pages/` — halaman: Home.tsx, Daftar.tsx, Not-Found.tsx
- `client/src/Components/` — Header.tsx, Footer.tsx, About.tsx
- `client/src/Style/app.scss` — semua custom styles (warna, layout, komponen)
- `vite.config.ts` — Vite config + API middleware (/api/contact, /api/leaderboard)
- `public/` — assets statis: favicon.png, Image/tales-hero-banner.png, robots.txt
- `index.html` — entry point HTML dengan meta tags SEO
- `client/.replit-artifact/artifact.toml` — konfigurasi artifact Replit

## Architecture decisions

- API routes dihandle sebagai Vite middleware (bukan server terpisah) karena logic-nya sederhana — tidak butuh database, tidak butuh session
- Source code ada di `client/src/` tapi package.json dan vite.config.ts ada di root (bukan subfolder terpisah)
- Mantine UI diganti dengan plain CSS/SCSS + wouter supaya tidak ada dependency Next.js

## Product

- Landing page (/) dengan hero section, navigasi smooth scroll, footer
- Halaman daftar (/daftar) — form registrasi hero dengan validasi email + password
- API /api/contact — validasi form pendaftaran
- API /api/leaderboard — data 10 besar pemain (mock)

## User preferences

- Tidak suka folder/file tambahan yang tidak perlu — jaga struktur seminimal mungkin
- Tidak suka `.replit-artifact` dan folder sistem muncul di GitHub — sudah di-gitignore

## Gotchas

- Jangan tambahkan `client` ke `packages` di pnpm-workspace.yaml — client/ bukan workspace package terpisah, root package.json yang handle
- Workflow command: `pnpm --include-workspace-root --filter @workspace/taleshero run dev` — ini jalankan script `dev` dari root package.json
- API middleware hanya berjalan di dev mode — untuk production perlu server terpisah (lihat task #3)

## Pointers

- See the `pnpm-workspace` skill for workspace structure details
