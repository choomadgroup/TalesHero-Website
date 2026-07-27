function turnstileConfig(_req, res) {
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();
  if (!siteKey) {
    return res.status(503).json({ message: 'Turnstile belum dikonfigurasi.' });
  }
  return res.status(200).json({ siteKey });
}

export default turnstileConfig;