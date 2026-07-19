import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5000;

const basePath = process.env.BASE_PATH ?? '/';

/* ── Per-route meta for social crawlers (no JS needed) ── */
const OG_IMAGE = 'https://taleshero.id/Image/tales-hero-banner.png';

const routeMeta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Tales Hero Indonesia — Game Online Action Adventure',
    description: 'Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!',
  },
  '/download': {
    title: 'Download — Tales Hero Indonesia',
    description: 'Unduh Tales Hero Indonesia sekarang dan mulai petualanganmu! Gratis untuk dimainkan di Windows PC.',
  },
  '/daftar': {
    title: 'Daftar — Tales Hero Indonesia',
    description: 'Daftarkan hero-mu dan bergabunglah dengan komunitas Tales Hero Indonesia. Gratis!',
  },
  '/login': {
    title: 'Login — Tales Hero Indonesia',
    description: 'Masuk ke akun Tales Hero Indonesia-mu dan lanjutkan petualanganmu.',
  },
  '/support': {
    title: 'Support — Tales Hero Indonesia',
    description: 'Butuh bantuan? Hubungi tim support Tales Hero Indonesia atau temukan jawaban di FAQ kami.',
  },
  '/guides/pengantar': {
    title: 'Pengantar — Tales Hero Indonesia',
    description: 'Pelajari dasar-dasar Tales Hero dan mulai perjalananmu di dunia action adventure penuh legenda.',
  },
  '/guides/karakter': {
    title: 'Karakter & Hero — Tales Hero Indonesia',
    description: 'Temukan semua karakter dan hero yang tersedia di Tales Hero Indonesia. Pilih hero favoritmu!',
  },
  '/guides/combat': {
    title: 'Sistem Pertarungan — Tales Hero Indonesia',
    description: 'Pelajari sistem pertarungan dan strategi terbaik untuk menang di Tales Hero Indonesia.',
  },
  '/guides/item': {
    title: 'Item & Equipment — Tales Hero Indonesia',
    description: 'Temukan semua item dan equipment yang bisa kamu gunakan untuk memperkuat hero di Tales Hero Indonesia.',
  },
};

function injectRouteMeta(html: string, url: string): string {
  const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  const meta = routeMeta[path] ?? routeMeta['/'];
  return html
    .replace(/(<title>)[^<]*/,           `$1${meta.title}`)
    .replace(/(name="description"\s+content=")[^"]*/,         `$1${meta.description}`)
    .replace(/(property="og:title"\s+content=")[^"]*/,        `$1${meta.title}`)
    .replace(/(property="og:description"\s+content=")[^"]*/,  `$1${meta.description}`)
    .replace(/(property="og:image"\s+content=")[^"]*/,        `$1${OG_IMAGE}`)
    .replace(/(name="twitter:title"\s+content=")[^"]*/,       `$1${meta.title}`)
    .replace(/(name="twitter:description"\s+content=")[^"]*/,  `$1${meta.description}`)
    .replace(/(name="twitter:image"\s+content=")[^"]*/,       `$1${OG_IMAGE}`);
}

const metaInjectorPlugin = {
  name: 'inject-route-meta',
  transformIndexHtml: {
    order: 'pre' as const,
    handler(html: string, ctx: { originalUrl?: string; path?: string }) {
      const url = ctx.originalUrl ?? ctx.path ?? '/';
      return injectRouteMeta(html, url);
    },
  },
};

const mockLeaderboard = [
  { rank: 1,  nama: 'ShadowKnight_ID',  level: 99, poin: 125000, server: 'Jakarta 1',  guild: 'Naga Merah' },
  { rank: 2,  nama: 'NagaApiIndo',      level: 98, poin: 118500, server: 'Surabaya 2', guild: 'Naga Merah' },
  { rank: 3,  nama: 'GarudaMerah',      level: 97, poin: 112300, server: 'Bandung 1',  guild: 'Garuda Sakti' },
  { rank: 4,  nama: 'PetirSamudra',     level: 96, poin: 108700, server: 'Jakarta 2',  guild: 'Samudra Biru' },
  { rank: 5,  nama: 'HeroNusantara',    level: 95, poin: 104200, server: 'Medan 1',    guild: 'Nusantara' },
  { rank: 6,  nama: 'BintangTimur77',   level: 94, poin: 99800,  server: 'Jakarta 1',  guild: 'Bintang Timur' },
  { rank: 7,  nama: 'SrikandiBaja',     level: 93, poin: 95600,  server: 'Yogyakarta', guild: 'Garuda Sakti' },
  { rank: 8,  nama: 'RajaLegenda',      level: 92, poin: 91200,  server: 'Surabaya 1', guild: 'Raja Alam' },
  { rank: 9,  nama: 'AnginRibut_X',     level: 91, poin: 87500,  server: 'Bandung 2',  guild: 'Angin Topan' },
  { rank: 10, nama: 'PrajuritEmas',     level: 90, poin: 83100,  server: 'Bali 1',     guild: 'Nusantara' },
];

/** Vite plugin: handle /api/* routes in dev (mirrors the original Next.js API routes) */
const apiPlugin = {
  name: 'api-routes',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use('/api/leaderboard', (_req: any, res: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      res.end(JSON.stringify({ success: true, total_pemain: 2187543, data: mockLeaderboard, updated: new Date().toISOString() }));
    });

    server.middlewares.use('/api/contact', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'Method tidak diizinkan' }));
      }
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const { nama, email, password } = JSON.parse(body);
          if (!nama || !email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Semua field harus diisi' }));
          }
          if (password.length < 8) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Password minimal 8 karakter' }));
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Format email tidak valid' }));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Akun berhasil dibuat!' }));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Request tidak valid' }));
        }
      });
    });
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    metaInjectorPlugin,
    apiPlugin,
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
