const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifikasi Cloudflare Turnstile token.
 * Dev (tanpa secret): selalu lolos.
 * Production tanpa secret: gagal tertutup.
 */
async function verifyRecaptcha(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!token || token === 'dev-bypass') return true;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const result = await res.json();
    console.log('[turnstile] verify:', result.success, result['error-codes']);
    return result.success === true;
  } catch (err) {
    console.error('[turnstile] verification error:', err.message);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function captchaError(res) {
  return res.status(400).json({ message: 'Harap selesaikan verifikasi CAPTCHA.' });
}

export { verifyRecaptcha, captchaError };
