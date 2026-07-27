const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Cloudflare Turnstile token on the server.
 *
 * Dev/preview: jika TURNSTILE_SECRET_KEY belum diset, verifikasi dilewati
 * agar developer bisa test tanpa perlu konfigurasi Turnstile lokal.
 * Production: wajib ada secret key — gagal tertutup jika tidak ada.
 */
async function verifyRecaptcha(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  // Lewati verifikasi di dev jika secret belum dikonfigurasi
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!token) return false;

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('[turnstile] verification failed:', error.message);
    return false;
  }
}

function captchaError(res) {
  return res.status(400).json({ message: 'Harap selesaikan verifikasi keamanan terlebih dahulu.' });
}

export { verifyRecaptcha, captchaError };
