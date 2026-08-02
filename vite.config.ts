import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import register from './server/auth/register.js';
import stats    from './server/stats.js';
import login from './server/auth/login.js';
import { connectMongoDB } from './server/mongodb.js';
import {
  publicGetNews, publicGetArticle, publicTrackView, publicReact,
  adminLogin, adminLogout, adminMe,
  adminGetAll, adminCreate, adminUpdate, adminDelete,
} from './server/news.js';
import {
  publicGetDownloads, adminGetDownloads, adminUpdateDownload,
} from './server/downloads.js';
import redeem from './server/redeem.js';
import {
  adminGetRedeemCodes, adminCreateRedeemCode,
  adminToggleRedeemCode, adminDeleteRedeemCode, adminSearchItem,
} from './server/admin-redeem.js';
import changePassword from './server/auth/change-password.js';
import updateProfile from './server/auth/update-profile.js';
import forgotPassword from './server/auth/forgot-password.js';
import emailResetPassword from './server/auth/email-reset-password.js';
import forgotSecurityQuestion from './server/auth/forgot-security-question.js';
import me from './server/auth/me.js';
import logout from './server/auth/logout.js';
import turnstileConfig from './server/auth/turnstile-config.js';
import { ping, migrate } from './server/db.js';
import { gmToolsRouter } from './server/gm-tools.js';
import { applySecurityHeaders } from './server/security.js';

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
  },
  '/login': {
    title: 'Login — Tales Hero Indonesia',
    description: 'Masuk ke akun Tales Hero Indonesia-mu dan lanjutkan petualanganmu.',
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

    // Security headers (CORS, CSP, X-Frame-Options, etc.) di dev server
    server.middlewares.use((req: any, res: any, next: any) => {
      applySecurityHeaders(req, res, next);
    });

    // Turnstile site key endpoint untuk dev
    server.middlewares.use('/api/config/turnstile', (req: any, res: any, next: any) => {
      if (req.method !== 'GET') { next(); return; }
      addJsonResponseHelpers(res);
      turnstileConfig(req, res);
    });

    // Server status (harus sebelum /api/stats)
    server.middlewares.use('/api/stats/server-status', async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        const { serverStatus } = await import('./server/stats.js');
        await serverStatus(req, res);
      } catch {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'offline', onlineCount: 0 }));
      }
    });

    // Stats: daftar nickname online (harus sebelum /api/stats agar tidak kena prefix-match)
    server.middlewares.use('/api/stats/online-players', async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        const { onlinePlayers } = await import('./server/stats.js');
        await onlinePlayers(req, res);
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify([]));
      }
    });

    // Stats: jumlah akun terdaftar
    server.middlewares.use('/api/stats', async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        await stats(req, res);
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ accounts: null }));
      }
    });

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

    // MongoDB (berita) — opsional, startup tidak gagal jika MONGODB_URI tidak ada
    if (process.env.MONGODB_URI) {
      try {
        await connectMongoDB();
        const mongoHost = new URL(process.env.MONGODB_URI).host;
        server.config.logger.info(`  \x1b[32m➜\x1b[0m  MongoDB: \x1b[36m${mongoHost}\x1b[0m`);
      } catch (err: any) {
        server.config.logger.error(`  MongoDB: ❌ gagal konek — ${err.message}`);
      }
    }

    server.middlewares.use('/auth/redeem', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try {
        addJsonResponseHelpers(res);
        req.body = await parseBody(req);
        await redeem(req, res);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });

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

    // ── News API (public) ────────────────────────────────────────────────────
    server.middlewares.use('/api/news', async (req: any, res: any, next: any) => {
      const parts = (req.url ?? '').split('?')[0].replace(/^\//, '').split('/');
      try {
        // POST /:category/:slug/view  — track view count
        if (req.method === 'POST' && parts.length >= 3 && parts[2] === 'view') {
          await publicTrackView(req, res, parts[0], parts[1]);
        // POST /:category/:slug/react — thumbsUp / heart
        } else if (req.method === 'POST' && parts.length >= 3 && parts[2] === 'react') {
          req.body = await parseBody(req);
          await publicReact(req, res, parts[0], parts[1], req.body);
        // GET /:category/:slug        — single article
        } else if (req.method === 'GET' && parts.length >= 2 && parts[0] && parts[1]) {
          await publicGetArticle(req, res, parts[0], parts[1]);
        // GET /                       — article list
        } else if (req.method === 'GET') {
          await publicGetNews(req, res);
        } else {
          next();
        }
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });

    // ── Downloads (public) ───────────────────────────────────────────────────
    server.middlewares.use('/api/downloads', async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') { next(); return; }
      try { await publicGetDownloads(req, res); }
      catch (e) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({message:'Server error'})); }
    });

    // ── Admin downloads CRUD ─────────────────────────────────────────────────
    server.middlewares.use('/api/admin/downloads', async (req: any, res: any, next: any) => {
      const pkgId = (req.url ?? '').split('?')[0].replace(/^\//, '').split('/')[0] || null;
      try {
        req.body = req.method === 'PUT' ? await parseBody(req) : undefined;
        if (pkgId && req.method === 'PUT') {
          await adminUpdateDownload(req, res, pkgId);
        } else if (!pkgId && req.method === 'GET') {
          await adminGetDownloads(req, res);
        } else { next(); }
      } catch (e) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({message:'Server error'})); }
    });

    // ── Admin auth ────────────────────────────────────────────────────────────
    server.middlewares.use('/api/admin/login', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try { req.body = await parseBody(req); adminLogin(req, res); }
      catch (e) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({message:'Server error'})); }
    });
    server.middlewares.use('/api/admin/logout', async (req: any, res: any, next: any) => {
      if (req.method !== 'POST') { next(); return; }
      try { adminLogout(req, res); }
      catch (e) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({message:'Server error'})); }
    });
    server.middlewares.use('/api/admin/me', async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') { next(); return; }
      try { adminMe(req, res); }
      catch (e) { res.statusCode = 500; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({message:'Server error'})); }
    });

    // ── Admin redeem CRUD ─────────────────────────────────────────────────────
    server.middlewares.use('/api/admin/redeem', async (req: any, res: any, next: any) => {
      try {
        addJsonResponseHelpers(res);
        const urlPath = (req.url ?? '').split('?')[0];
        const idMatch = urlPath.replace(/^\//, '').match(/^(\d+)$/);
        const id = idMatch ? idMatch[1] : null;
        if (req.method === 'GET' && urlPath.includes('search-item')) {
          req.query = Object.fromEntries(new URL('http://x' + req.url).searchParams.entries());
          await adminSearchItem(req, res);
        } else if (!id && req.method === 'GET') {
          await adminGetRedeemCodes(req, res);
        } else if (!id && req.method === 'POST') {
          req.body = await parseBody(req);
          await adminCreateRedeemCode(req, res);
        } else if (id && req.method === 'PATCH') {
          req.params = { id };
          await adminToggleRedeemCode(req, res);
        } else if (id && req.method === 'DELETE') {
          req.params = { id };
          await adminDeleteRedeemCode(req, res);
        } else { next(); }
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });

    // ── GM Tools (player mgmt, send cash/TR/item, ban, requests, logs) ───────
    server.middlewares.use('/api/admin/gm', async (req: any, res: any, next: any) => {
      try {
        addJsonResponseHelpers(res);
        req.body  = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await parseBody(req) : undefined;
        req.query = Object.fromEntries(new URL('http://x' + req.url).searchParams.entries());
        await gmToolsRouter(req, res, next);
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });

    // ── Admin news CRUD ───────────────────────────────────────────────────────
    server.middlewares.use('/api/admin/news', async (req: any, res: any, next: any) => {
      const urlPath = (req.url ?? '').split('?')[0];
      // /api/admin/news/<id>
      const idMatch = urlPath.match(/^\/([a-f0-9]{24})$/i);
      const id = idMatch ? idMatch[1] : null;
      try {
        req.body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await parseBody(req) : undefined;
        if (id) {
          if      (req.method === 'PUT'   || req.method === 'PATCH') await adminUpdate(req, res, id);
          else if (req.method === 'DELETE') await adminDelete(req, res, id);
          else next();
        } else {
          if      (req.method === 'GET')  await adminGetAll(req, res);
          else if (req.method === 'POST') await adminCreate(req, res);
          else next();
        }
      } catch (e) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Server error' }));
      }
    });
  },
};

export default defineConfig({
  base: basePath,
  plugins: [
    react({ include: /\.(jsx|js|tsx|ts)$/ }),
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
