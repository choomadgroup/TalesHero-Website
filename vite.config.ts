import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import register from './server/auth/register.js';
import login from './server/auth/login.js';
import changePassword from './server/auth/change-password.js';
import updateProfile from './server/auth/update-profile.js';
import forgotPassword from './server/auth/forgot-password.js';
import emailResetPassword from './server/auth/email-reset-password.js';
import forgotSecurityQuestion from './server/auth/forgot-security-question.js';
import me from './server/auth/me.js';
import logout from './server/auth/logout.js';
import { ping, migrate } from './server/db.js';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5000;

const basePath = process.env.BASE_PATH ?? '/';

/* ── Per-route meta for social crawlers (no JS needed) ── */
const OG_IMAGE = 'https://taleshero.web.id/Image/tales-hero-banner.png';

const routeMeta: Record<string, { title: string; description: string; robots?: string }> = {
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
    robots: 'noindex, nofollow',
  },
  '/login': {
    title: 'Login — Tales Hero Indonesia',
    description: 'Masuk ke akun Tales Hero Indonesia-mu dan lanjutkan petualanganmu.',
    robots: 'noindex, nofollow',
  },
  '/forgot-password': {
    title: 'Pemulihan Akun — Tales Hero Indonesia',
    description: 'Kirim link reset kata sandi atau pertanyaan keamanan ke email terdaftar.',
    robots: 'noindex, nofollow',
  },
  '/reset-password': {
    title: 'Reset Kata Sandi — Tales Hero Indonesia',
    description: 'Atur ulang kata sandi akun Tales Hero Indonesia.',
    robots: 'noindex, nofollow',
  },
  '/akun': {
    title: 'Akun — Tales Hero Indonesia',
    description: 'Kelola akun Tales Hero Indonesia-mu.',
    robots: 'noindex, nofollow',
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
  '/news': {
    title: 'News — Tales Hero Indonesia',
    description: 'Berita terbaru seputar Tales Hero Indonesia: update server, informasi game, dan jadwal maintenance.',
  },
  '/news/info/2026-07-15-tentang-tales-hero': {
    title: 'Apa Itu Tales Hero Indonesia? — Tales Hero Indonesia',
    description: 'Tales Hero Indonesia adalah game online action adventure yang mengajak kamu berpetualangan dalam berbagai legenda termashur di dunia. Kenali lebih jauh gamenya di sini.',
  },
  '/news/maintenance/2026-07-18-maintenance-rutin': {
    title: 'Maintenance Rutin — 18 Juli 2026 — Tales Hero Indonesia',
    description: 'Server akan mengalami maintenance rutin pada 18 Juli 2026 pukul 02.00–06.00 WIB. Selama maintenance, server tidak dapat diakses.',
  },
  '/news/update/2026-07-20-server-perdana': {
    title: 'Website Tales Hero Indonesia — Masih Dalam Pengerjaan — Tales Hero Indonesia',
    description: 'Website resmi Tales Hero Indonesia sedang dalam tahap pengembangan aktif. Pantau terus untuk informasi terbaru seputar peluncuran server dan fitur-fitur yang akan hadir.',
  },
  '/news/info/2026-07-22-open-beta': {
    title: 'Open Beta Tales Hero Indonesia Akan Segera Dibuka! — Tales Hero Indonesia',
    description: 'Open Beta Tales Hero Indonesia akan segera hadir. Daftarkan akunmu sekarang dan jadilah yang pertama merasakan petualangan epik bersama teman-temanmu.',
  },
};

function injectRouteMeta(html: string, url: string): string {
  const path = url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  const meta = routeMeta[path] ?? (path.startsWith('/news/') ? routeMeta['/news'] : routeMeta['/']);
  return html
    .replace(/(<title>)[^<]*/,           `$1${meta.title}`)
    .replace(/(name="description"\s+content=")[^"]*/,         `$1${meta.description}`)
    .replace(/(name="robots"\s+content=")[^"]*/,               `$1${meta.robots ?? 'index, follow'}`)
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


function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) { resolve(req.body); return; }
    let raw = '';
    req.resume();
    req.setEncoding('utf8');
    req.on('data', (chunk: any) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
    setTimeout(() => reject(new Error('Body read timeout')), 5000);
  });
}

function addJsonResponseHelpers(res: any) {
  res.status = (statusCode: number) => {
    res.statusCode = statusCode;
    return res;
  };
  res.json = (payload: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
    return res;
  };
}

const apiPlugin = {
  name: 'tales-hero-api',
  async configureServer(server: any) {
    const blockedSourcePath = /^\/(?:client\/src|server|attached_assets|\.local|\.agents|node_modules)(?:\/|$)|^\/(?:vite\.config\.ts|package\.json|pnpm-lock\.yaml|tsconfig(?:\.[^/]+)?|\.env(?:\.[^/]*)?)$/i;

    // Vite must serve source modules to the local app, but a browser navigation
    // to a source/config path should never render the file as a public page.
    server.middlewares.use((req: any, res: any, next: any) => {
      const requestPath = (req.url ?? '').split('?')[0];
      const fetchDestination = req.headers?.['sec-fetch-dest'];
      const isDirectRequest = !fetchDestination || fetchDestination === 'document'
        || String(req.headers?.accept ?? '').includes('text/html');
      if (req.method === 'GET' && isDirectRequest && blockedSourcePath.test(requestPath)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not found');
        return;
      }
      next();
    });

    const host = process.env.DB_HOST ?? '?';
    const db   = process.env.DB_NAME ?? 'tr_game_db';
    const hasDatabaseConfig = Boolean(
      process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_PASSWORD,
    );

    if (hasDatabaseConfig) {
      try {
        await ping();
        server.config.logger.info(`  \x1b[32m➜\x1b[0m  MySQL: \x1b[36m${host}\x1b[0m (${db})`);
        await migrate();
      } catch (err: any) {
        server.config.logger.error(`  MySQL: ❌ gagal konek — ${err.message}`);
      }
    }

    server.middlewares.use('/auth/register', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        req.body = await parseBody(req);
        await register(req, res);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
    server.middlewares.use('/auth/login', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        req.body = await parseBody(req);
        await login(req, res);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
    server.middlewares.use('/auth/me', async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        await me(req, res);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
    server.middlewares.use('/auth/logout', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        await logout(req, res);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
    server.middlewares.use('/auth/change-password', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        req.body = await parseBody(req);
        await changePassword(req, res);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
    server.middlewares.use('/auth/update-profile', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        req.body = await parseBody(req);
        await updateProfile(req, res);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });

    const emailRecoveryRoutes = [
      ['/auth/forgot-password', forgotPassword],
      ['/auth/email-reset-password', emailResetPassword],
      ['/auth/forgot-security-question', forgotSecurityQuestion],
    ] as const;

    for (const [route, handler] of emailRecoveryRoutes) {
      server.middlewares.use(route, async (req: any, res: any, next: any) => {
        if (req.method !== 'POST') { next(); return; }
        try {
          addJsonResponseHelpers(res);
          req.body = await parseBody(req);
          await handler(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Server error' }));
        }
      });
    }
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
          remarkGfm,
        ],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
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
    sourcemap: false,         // jangan bocorkan source map di production
    minify: 'terser',         // obfuscasi + minify lebih agresif dari default esbuild
    terserOptions: {
      compress: {
        drop_console: false,  // console copyright tetap jalan
        drop_debugger: true,  // hapus debugger statement
      },
      mangle: true,           // rename variabel & fungsi jadi nama pendek/acak
    },
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
