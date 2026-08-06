const DEFAULT_ALLOWED_ORIGINS = [
  'https://taleshero.web.id',
  'https://www.taleshero.web.id',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

function allowedOrigins() {
  return new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
    ...(process.env.REPLIT_DEV_DOMAIN
      ? [`https://${process.env.REPLIT_DEV_DOMAIN}`]
      : []),
  ]);
}

function applySecurityHeaders(req, res, next) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const scriptSources = [
    "'self'",
    'https://challenges.cloudflare.com',
    ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
  ].join(' ');
  const connectSources = [
    "'self'",
    'https://challenges.cloudflare.com',
    'https://challenges.cloudflare.com/',
    ...(isDevelopment ? ['ws:', 'wss:'] : []),
  ].join(' ');

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${scriptSources}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://taleshero.web.id https://www.taleshero.web.id https://talesrunner.b-cdn.net",
      `connect-src ${connectSources}`,
      'frame-src https://challenges.cloudflare.com',
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
    ].join('; '),
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }

  const origin = req.headers.origin;
  if (origin && allowedOrigins().has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Requested-With',
    );
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  next();
}

export { applySecurityHeaders };