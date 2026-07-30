import crypto from 'node:crypto';

const COOKIE = 'th_admin';
const TTL    = 8 * 60 * 60; // 8 hours

function secret() {
  return process.env.SESSION_SECRET || 'dev-fallback-secret';
}

function sign(v) {
  return v + '.' + crypto.createHmac('sha256', secret()).update(v).digest('base64url');
}

function verify(signed) {
  const i = signed.lastIndexOf('.');
  if (i === -1) return false;
  const v        = signed.slice(0, i);
  const expected = sign(v);
  const a        = Buffer.from(expected);
  const b        = Buffer.from(signed);
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(a, b); } catch { return false; }
}

function parseCookies(header = '') {
  const result = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) result[k] = decodeURIComponent(v);
  }
  return result;
}

export function setAdminCookie(res) {
  const token  = sign('admin:' + Date.now());
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${TTL}; HttpOnly; SameSite=Strict${secure}`,
  );
}

export function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`);
}

export function isAdminAuthenticated(req) {
  const cookies = parseCookies(req.headers?.cookie ?? '');
  const val     = cookies[COOKIE];
  return val ? verify(val) : false;
}
