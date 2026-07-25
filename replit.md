# Tales Hero Indonesia

Website game online action adventure Tales Hero Indonesia — landing page + halaman pendaftaran hero.

## Run & Operate

- `client: web` workflow — jalankan dev server (port dari env `PORT`)
- `pnpm run typecheck` — typecheck seluruh project

## Stack

- pnpm workspaces, Node.js 20, TypeScript
- Frontend: React 19 + Vite 7, wouter (routing), react-scroll (smooth scroll), react-icons, Sass
- API routes: Express production server di `server/index.js` dan Vite middleware saat development
- Auth memakai MySQL eksternal milik game (`tr_game_db.userinfofrompublisher`)

## Where things live

- `client/src/Pages/` — halaman: Home.tsx, Daftar.tsx, Not-Found.tsx
- `client/src/Components/` — Header.tsx, Footer.tsx, About.tsx
- `client/src/Style/app.scss` — semua custom styles (warna, layout, komponen)
- `vite.config.ts` — Vite config + API middleware saat development
- `server/index.js` — server production untuk Railway (static frontend + auth API)
- `server/auth/` — register/login ke tabel akun game
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
- API /auth/register — menyimpan akun baru ke `tr_game_db.userinfofrompublisher`
- API /auth/login — memeriksa username dan MD5 password game
- API /api/leaderboard — data 10 besar pemain (mock)

## User preferences

- Tidak suka folder/file tambahan yang tidak perlu — jaga struktur seminimal mungkin
- Tidak suka `.replit-artifact` dan folder sistem muncul di GitHub — sudah di-gitignore

## Deploy ke Cloudflare Pages

Setting di Cloudflare Pages:
- **Build command:** `pnpm run build`
- **Output directory:** `dist/public`
- **Root directory:** (kosongkan / root)

API routes berjalan sebagai **Cloudflare Pages Functions** di folder `functions/`:
- `functions/api/leaderboard.js` — GET /api/leaderboard
- `functions/api/contact.js` — POST /api/contact

SPA routing ditangani oleh `public/_redirects` (`/* /index.html 200`) yang otomatis ikut di-copy saat build.

## Gotchas

- Jangan tambahkan `client` ke `packages` di pnpm-workspace.yaml — client/ bukan workspace package terpisah, root package.json yang handle
- Workflow command: `pnpm --include-workspace-root --filter @workspace/taleshero run dev` — ini jalankan script `dev` dari root package.json
- Railway menjalankan `pnpm run start`, bukan static server, agar endpoint auth tetap aktif
- Akun baru masuk ke `userinfofrompublisher`; tabel `userinfo`, `userinfogame`, dan `userinfologin` dibuat game server saat login pertama

## Pointers

- See the `pnpm-workspace` skill for workspace structure details
