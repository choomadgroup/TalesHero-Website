import path from 'node:path';
import fs   from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import register from './auth/register.js';
import login from './auth/login.js';
import changePassword from './auth/change-password.js';
import changeNickname from './auth/change-nickname.js';
import nicknameLogs from './auth/nickname-logs.js';
import updateProfile from './auth/update-profile.js';
import forgotPassword from './auth/forgot-password.js';
import emailResetPassword from './auth/email-reset-password.js';
import forgotSecurityQuestion from './auth/forgot-security-question.js';
import accountInfo from './auth/account-info.js';
import me from './auth/me.js';
import logout from './auth/logout.js';
import redeem from './redeem.js';
import {
  adminGetRedeemCodes, adminCreateRedeemCode,
  adminToggleRedeemCode, adminDeleteRedeemCode, adminSearchItem,
} from './admin-redeem.js';
import turnstileConfig from './auth/turnstile-config.js';
import verifyRegistration from './auth/verify-registration.js';
import resendRegistration from './auth/resend-registration.js';
import stats, { onlinePlayers } from './stats.js';
import { migrate } from './db.js';
import { applySecurityHeaders } from './security.js';
import { connectMongoDB } from './mongodb.js';
import {
  publicGetNews, publicGetArticle,
  adminLogin, adminLogout, adminMe,
  adminGetAll, adminCreate, adminUpdate, adminDelete,
} from './news.js';
import {
  publicGetDownloads, adminGetDownloads, adminUpdateDownload,
} from './downloads.js';
import { gmToolsRouter } from './gm-tools.js';
import { publicGetItems, publicGetItemImage } from './items.js';
import { submitApplication, getApplications, updateApplicationStatus, deleteApplication, getMyStatus, getPositions, adminGetPositions, adminUpdatePosition } from './career.js';

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
app.get('/auth/verify-registration', verifyRegistration);
app.post('/auth/resend-registration', resendRegistration);
app.get('/api/stats/online-players', onlinePlayers);
app.get('/api/stats', stats);
app.get('/api/items', publicGetItems);
app.get('/api/items/image/:part/:id.png', publicGetItemImage);

const blockedPublicPath = /^\/(?:client|src|server|attached_assets|public|\.local|\.agents|node_modules|\.git)(?:\/|$)|^\/(?:vite\.config\.(?:ts|js)|package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig(?:\.[^/]+)?|wrangler\.toml|railway\.toml|replit\.md|README(?:\.[^/]+)?|\.replit(?:\.[^/]*)?|\.env(?:\.[^/]*)?)$/i;
const privatePagePath = /^\/(?:forgot-password|reset-password|akun|nickname|dashboard\/admin)(?:\/|$)/i;

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

// ── Rate limiter for admin login (simple in-memory, max 10 req / 15 min / IP) ──
const _loginAttempts = new Map(); // ip → { count, resetAt }
const RATE_LIMIT_MAX   = 10;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function adminRateLimit(req, res, next) {
  const ip      = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  const now     = Date.now();
  const entry   = _loginAttempts.get(ip);

  if (entry && now < entry.resetAt) {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      const retry = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      res.status(429).json({ message: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(retry / 60)} menit.` });
      return;
    }
  } else {
    _loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }
  next();
}

app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/me', me);
app.post('/auth/logout', logout);
app.post('/auth/change-password', changePassword);
app.post('/auth/change-nickname', changeNickname);
app.get('/auth/nickname-logs', nicknameLogs);
app.post('/auth/update-profile', updateProfile);
app.post('/auth/forgot-password', forgotPassword);
app.post('/auth/email-reset-password', emailResetPassword);
app.post('/auth/forgot-security-question', forgotSecurityQuestion);
app.post('/auth/account-info', accountInfo);
app.post('/auth/redeem', redeem);

// ── Admin redeem CRUD ─────────────────────────────────────────────────────────
app.get('/api/admin/redeem/search-item', adminSearchItem);
app.get('/api/admin/redeem',        adminGetRedeemCodes);
app.post('/api/admin/redeem',       adminCreateRedeemCode);
app.patch('/api/admin/redeem/:id',  (req, res) => { req.params = { id: req.params.id }; adminToggleRedeemCode(req, res); });
app.delete('/api/admin/redeem/:id', (req, res) => { req.params = { id: req.params.id }; adminDeleteRedeemCode(req, res); });

// ── News API (public) ─────────────────────────────────────────────────────────
app.get('/api/news', publicGetNews);
app.get('/api/news/:category/:slug', (req, res) =>
  publicGetArticle(req, res, req.params.category, req.params.slug)
);

// ── Admin auth ────────────────────────────────────────────────────────────────
app.post('/api/admin/login', adminRateLimit, adminLogin);
app.post('/api/admin/logout', adminLogout);
app.get('/api/admin/me',      adminMe);

// ── Admin news CRUD ───────────────────────────────────────────────────────────
app.get('/api/admin/news',         adminGetAll);
app.post('/api/admin/news',        adminCreate);
app.put('/api/admin/news/:id',     (req, res) => adminUpdate(req, res, req.params.id));
app.delete('/api/admin/news/:id',  (req, res) => adminDelete(req, res, req.params.id));

// ── Downloads (public + admin) ────────────────────────────────────────────────
app.get('/api/downloads',                  publicGetDownloads);
app.get('/api/admin/downloads',            adminGetDownloads);
app.put('/api/admin/downloads/:id',        (req, res) => adminUpdateDownload(req, res, req.params.id));

// ── Career Applications ───────────────────────────────────────────────────────
app.get('/api/career/positions',                  getPositions);
app.get('/api/career/my-status',                  getMyStatus);
app.post('/api/career/apply',                     submitApplication);
app.get('/api/admin/career/applications',          getApplications);
app.patch('/api/admin/career/applications/:id',    (req, res) => updateApplicationStatus(req, res));
app.delete('/api/admin/career/applications/:id',   (req, res) => deleteApplication(req, res));
app.get('/api/admin/career/positions',             adminGetPositions);
app.patch('/api/admin/career/positions/:position', (req, res) => adminUpdatePosition(req, res));

// ── GM Tools ──────────────────────────────────────────────────────────────────
app.use('/api/admin/gm', async (req, res, next) => {
  try { await gmToolsRouter(req, res, next); }
  catch (err) { console.error('[gm]', err); res.status(500).json({ message: 'Server error.' }); }
});

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

connectMongoDB().catch(err => console.error('[MongoDB] startup error:', err.message));

app.listen(port, '0.0.0.0', () => {
  console.log(`Tales Hero production server listening on port ${port}`);
});