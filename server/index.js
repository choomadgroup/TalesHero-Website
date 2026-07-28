import path from 'node:path';
import fs   from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import register from './auth/register.js';
import login from './auth/login.js';
import changePassword from './auth/change-password.js';
import updateProfile from './auth/update-profile.js';
import forgotPassword from './auth/forgot-password.js';
import emailResetPassword from './auth/email-reset-password.js';
import forgotSecurityQuestion from './auth/forgot-security-question.js';
import me from './auth/me.js';
import logout from './auth/logout.js';
import turnstileConfig from './auth/turnstile-config.js';
import stats    from './stats.js';
import { migrate } from './db.js';
import { applySecurityHeaders } from './security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'dist', 'public');
const port = Number(process.env.PORT || 3000);
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(applySecurityHeaders);

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});
app.get('/api/config/turnstile', turnstileConfig);
app.get('/api/stats', stats);

const blockedPublicPath = /^\/(?:client\/src|server|attached_assets|\.local|\.agents|node_modules)(?:\/|$)|^\/(?:vite\.config\.ts|package\.json|pnpm-lock\.yaml|tsconfig(?:\.[^/]+)?|\.env(?:\.[^/]*)?)$/i;
const privatePagePath = /^\/(?:forgot-password|reset-password|akun)(?:\/|$)/i;

// Never let source, backend modules, workspace metadata, or environment files
// reach the public production server, even through the SPA fallback.
app.use((req, res, next) => {
  if (blockedPublicPath.test(req.path)) {
    res.status(404).type('text').send('Not found');
    return;
  }
  if (privatePagePath.test(req.path)) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
});

app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/me', me);
app.post('/auth/logout', logout);
app.post('/auth/change-password', changePassword);
app.post('/auth/update-profile', updateProfile);
app.post('/auth/forgot-password', forgotPassword);
app.post('/auth/email-reset-password', emailResetPassword);
app.post('/auth/forgot-security-question', forgotSecurityQuestion);

// ── Per-route OG meta injection ─────────────────────────────────────────────
const OG_IMAGE = 'https://taleshero.web.id/Image/tales-hero-banner.png';
const ROUTE_META = {
  '/': { title: 'Tales Hero Indonesia — Game Online Action Adventure', description: 'Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!' },
  '/daftar': { title: 'Daftar Akun — Tales Hero Indonesia', description: 'Buat akun Tales Hero Indonesia-mu sekarang, gratis! Daftarkan hero-mu dan bergabunglah dengan komunitas petualang dari seluruh Indonesia.' },
  '/login': { title: 'Login — Tales Hero Indonesia', description: 'Masuk ke akun Tales Hero Indonesia-mu dan lanjutkan petualanganmu bersama teman-temanmu.' },
  '/support': { title: 'Support — Tales Hero Indonesia', description: 'Butuh bantuan? Hubungi tim support Tales Hero Indonesia atau temukan jawaban di FAQ kami.' },
  '/download': { title: 'Download — Tales Hero Indonesia', description: 'Unduh Tales Hero Indonesia sekarang dan mulai petualanganmu! Gratis untuk dimainkan di Windows PC.' },
  '/news': { title: 'News — Tales Hero Indonesia', description: 'Berita terbaru seputar Tales Hero Indonesia: update server, informasi game, dan jadwal maintenance.' },
};
function injectMeta(html, urlPath) {
  const key = urlPath.replace(/\/$/, '') || '/';
  const meta = ROUTE_META[key] ?? ROUTE_META['/'];
  return html
    .replace(/(<title>)[^<]*/, `$1${meta.title}`)
    .replace(/(name="description"\s+content=")[^"]*/, `$1${meta.description}`)
    .replace(/(property="og:title"\s+content=")[^"]*/, `$1${meta.title}`)
    .replace(/(property="og:description"\s+content=")[^"]*/, `$1${meta.description}`)
    .replace(/(property="og:image"\s+content=")[^"]*/, `$1${OG_IMAGE}`)
    .replace(/(name="twitter:title"\s+content=")[^"]*/, `$1${meta.title}`)
    .replace(/(name="twitter:description"\s+content=")[^"]*/, `$1${meta.description}`)
    .replace(/(name="twitter:image"\s+content=")[^"]*/, `$1${OG_IMAGE}`);
}

app.use(express.static(publicDir, { index: false }));

// SPA fallback — inject route-specific meta before serving index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    const indexPath = path.join(publicDir, 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
      if (err) return next(err);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(injectMeta(html, req.path));
    });
    return;
  }
  next();
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

migrate()
  .then(() => console.log('[Database] tales_hero_web_users sukses terhubung.'))
  .catch(err => console.error('[Database] migrate error:', err.message));

app.listen(port, '0.0.0.0', () => {
  console.log(`Tales Hero production server listening on port ${port}`);
});