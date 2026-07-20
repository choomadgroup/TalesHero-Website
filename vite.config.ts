import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5000;

const basePath = process.env.BASE_PATH ?? '/';

/* ── Per-route meta for social crawlers (no JS needed) ── */
const OG_IMAGE = 'https://taleshero.web.id/Image/tales-hero-banner.png';

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


export default defineConfig({
  base: basePath,
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    runtimeErrorOverlay(),
    metaInjectorPlugin,
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
