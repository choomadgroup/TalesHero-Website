import crypto from 'node:crypto';

const buckets = new Map();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function digest(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

function getBucket(key, now) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 0, resetAt: now };
    buckets.set(key, next);
    return next;
  }
  return current;
}

/**
 * Registration limits are intentionally keyed by IP, email, and username.
 * A shared household/warnet IP cannot block everyone by itself because the
 * email and username limits are checked independently.
 */
export function registrationRateLimit(req, { email, username }) {
  const now = Date.now();
  const checks = [
    [`ip:${clientIp(req)}`, 3, DAY],
    [`email:${digest(email)}`, 5, HOUR],
    [`username:${digest(username.toLowerCase())}`, 5, HOUR],
  ];

  const blocked = checks
    .map(([key, limit, window]) => {
      const bucket = getBucket(key, now);
      return bucket.count >= limit
        ? Math.ceil((bucket.resetAt - now) / 1000)
        : null;
    })
    .filter(Boolean);

  if (blocked.length > 0) {
    return { retryAfter: Math.max(...blocked) };
  }

  for (const [key, _limit, window] of checks) {
    const bucket = getBucket(key, now);
    bucket.count += 1;
    bucket.resetAt = now + window;
  }

  // Avoid retaining stale keys forever in a long-running production process.
  if (buckets.size > 10_000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  return null;
}

export function accountInfoRateLimit(req, email) {
  const now = Date.now();
  const ip = clientIp(req);
  const checks = [
    [`account-info:ip:${ip}`, 10, HOUR],
    [`account-info:email:${digest(email.toLowerCase())}`, 3, HOUR],
  ];

  const blocked = checks
    .map(([key, limit, window]) => {
      const bucket = getBucket(key, now);
      return bucket.count >= limit
        ? Math.ceil((bucket.resetAt - now) / 1000)
        : null;
    })
    .filter(Boolean);

  if (blocked.length > 0) return { retryAfter: Math.max(...blocked) };

  for (const [key, _limit, window] of checks) {
    const bucket = getBucket(key, now);
    bucket.count += 1;
    bucket.resetAt = now + window;
  }
  return null;
}