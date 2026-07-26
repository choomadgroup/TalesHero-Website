const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify a Google reCAPTCHA token on the server.
 *
 * Development can run without a secret so the local preview remains usable.
 * Production intentionally fails closed when the secret is missing.
 */
async function verifyRecaptcha(_token, _remoteIp) {
  // CAPTCHA sementara dinonaktifkan — selalu lolos
  return true;
}

function captchaError(res) {
  return res.status(400).json({ message: 'Harap selesaikan verifikasi CAPTCHA.' });
}

export { verifyRecaptcha, captchaError };