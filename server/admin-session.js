import crypto from 'node:crypto';

const COOKIE = 'th_admin';
const TTL    = 8 * 60 * 60; // 8 hours

// ── Allowed staff roles ────────────────────────────────────────────────────────
export const STAFF_ROLES = new Set(['Owner', 'Staff', 'GM']);

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

/**
 * Buat cookie admin yang menyimpan informasi user staff.
 * Payload: "username\x1Fnickname\x1Frole\x1Ftimestamp"
 */
export function setAdminCookie(res, { username, nickname, role }) {
  // Use unit-separator (non-printable) to avoid collisions with user data
  const payload = [
    encodeURIComponent(username),
    encodeURIComponent(nickname || ''),
    encodeURIComponent(role     || ''),
    Date.now(),
  ].join('\x1F');

  const token  = sign(payload);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${TTL}; HttpOnly; SameSite=Strict${secure}`,
  );
}

export function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`);
}

/**
 * Verifikasi cookie dan kembalikan data user staff, atau null jika tidak valid.
 * @returns {{ username: string, nickname: string, role: string } | null}
 */
export function getAdminUser(req) {
  const cookies = parseCookies(req.headers?.cookie ?? '');
  const val     = cookies[COOKIE];
  if (!val) return null;
  if (!verify(val)) return null;

  const payload = val.slice(0, val.lastIndexOf('.'));
  const parts   = payload.split('\x1F');
  if (parts.length < 4) return null;

  const [u, n, r] = parts.map(decodeURIComponent);
  if (!u || !STAFF_ROLES.has(r)) return null;

  return { username: u, nickname: n, role: r };
}

export function isAdminAuthenticated(req) {
  return getAdminUser(req) !== null;
}
