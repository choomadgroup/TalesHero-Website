/**
 * Ambil IP pengguna asli saat aplikasi berada di balik reverse proxy.
 * Proxy Replit/Railway meneruskan alamat asli melalui X-Forwarded-For.
 */
export function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? '';
}