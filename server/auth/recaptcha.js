const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify a Google reCAPTCHA token on the server.
 *
 * Development can run without a secret so the local preview remains usable.
 * Production intentionally fails closed when the secret is missing.
 */
async function verifyRecaptcha(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!token) { console.log('[recaptcha] token missing'); return false; }
  console.log('[recaptcha] token preview:', typeof token, String(token).slice(0, 30));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteIp) body.set('remoteip', remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    if (!response.ok) return false;

    const result = await response.json();
    console.log('[recaptcha] Google response:', JSON.stringify(result));
    return result.success === true;
  } catch (error) {
    console.error('[recaptcha] verification error:', error.message);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function captchaError(res) {
  return res.status(400).json({ message: 'Harap selesaikan verifikasi CAPTCHA.' });
}

export { verifyRecaptcha, captchaError };