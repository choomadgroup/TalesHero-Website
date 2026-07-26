import crypto from 'node:crypto';
import { query } from '../db.js';

const COOKIE_NAME = 'taleshero_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function hashToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator === -1) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function cookieOptions(maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieOptions()}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; ${cookieOptions(0)}`,
  );
}

async function createSession(res, username) {
  // Remove expired records opportunistically; active sessions on other devices
  // remain valid until their own expiry.
  await query('DELETE FROM tales_hero_sessions WHERE expires_at <= NOW()');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await query(
    `INSERT INTO tales_hero_sessions (token_hash, username, expires_at)
     VALUES (?, ?, ?)`,
    [hashToken(token), username, expiresAt],
  );
  setSessionCookie(res, token);
}

async function getSessionUsername(req) {
  const token = parseCookies(req.headers?.cookie ?? '')[COOKIE_NAME];
  if (!token) return null;

  const rows = await query(
    `SELECT username
     FROM tales_hero_sessions
     WHERE token_hash = ? AND expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)],
  );
  return rows[0]?.username ?? null;
}

async function destroySession(req, res) {
  const token = parseCookies(req.headers?.cookie ?? '')[COOKIE_NAME];
  if (token) {
    await query('DELETE FROM tales_hero_sessions WHERE token_hash = ?', [hashToken(token)]);
  }
  clearSessionCookie(res);
}

export { createSession, getSessionUsername, destroySession };