/**
 * Post-build script: generate per-route index.html with correct OG meta tags
 * so Discord/WhatsApp/social crawlers get route-specific previews.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist/public');
const OG_IMAGE = 'https://taleshero.web.id/Image/tales-hero-banner.png';

const routeMeta = {
  '/download': {
    title: 'Download — Tales Hero Indonesia',
    description: 'Unduh Tales Hero Indonesia sekarang dan mulai petualanganmu! Gratis untuk dimainkan di Windows PC.',
  },
  '/daftar': {
    title: 'Daftar — Tales Hero Indonesia',
    description: 'Daftarkan hero-mu dan bergabunglah dengan komunitas Tales Hero Indonesia. Gratis!',
  },
  '/login': {
    title: 'Login — Tales Hero Indonesia',
    description: 'Masuk ke akun Tales Hero Indonesia-mu dan lanjutkan petualanganmu.',
  },
  '/support': {
    title: 'Support — Tales Hero Indonesia',
    description: 'Butuh bantuan? Hubungi tim support Tales Hero Indonesia atau temukan jawaban di FAQ kami.',
  },
  '/guides/pengantar': {
    title: 'Pengantar — Tales Hero Indonesia',
    description: 'Pelajari dasar-dasar Tales Hero dan mulai perjalananmu di dunia action adventure penuh legenda.',
  },
  '/guides/karakter': {
    title: 'Karakter & Hero — Tales Hero Indonesia',
    description: 'Temukan semua karakter dan hero yang tersedia di Tales Hero Indonesia. Pilih hero favoritmu!',
  },
  '/guides/combat': {
    title: 'Sistem Pertarungan — Tales Hero Indonesia',
    description: 'Pelajari sistem pertarungan dan strategi terbaik untuk menang di Tales Hero Indonesia.',
  },
  '/guides/item': {
    title: 'Item & Equipment — Tales Hero Indonesia',
    description: 'Temukan semua item dan equipment yang bisa kamu gunakan untuk memperkuat hero di Tales Hero Indonesia.',
  },

  // ── News routes — WAJIB ada agar GitHub Pages sajikan 200, bukan 404 ──
  '/news': {
    title: 'News — Tales Hero Indonesia',
    description: 'Berita terbaru seputar Tales Hero Indonesia: update server, informasi game, dan jadwal maintenance.',
  },
  '/news/info/2026-07-15-tentang-tales-hero': {
    title: 'Apa Itu Tales Hero Indonesia? — Tales Hero Indonesia',
    description: 'Tales Hero Indonesia adalah game online action adventure yang mengajak kamu berpetualangan dalam berbagai legenda termashur di dunia. Kenali lebih jauh gamenya di sini.',
  },
  '/news/maintenance/2026-07-18-maintenance-rutin': {
    title: 'Maintenance Rutin — 18 Juli 2026 — Tales Hero Indonesia',
    description: 'Server akan mengalami maintenance rutin pada 18 Juli 2026 pukul 02.00–06.00 WIB. Selama maintenance, server tidak dapat diakses.',
  },
  '/news/update/2026-07-20-server-perdana': {
    title: 'Website Tales Hero Indonesia — Masih Dalam Pengerjaan — Tales Hero Indonesia',
    description: 'Website resmi Tales Hero Indonesia sedang dalam tahap pengembangan aktif. Pantau terus untuk informasi terbaru seputar peluncuran server dan fitur-fitur yang akan hadir.',
  },
  '/news/info/2026-07-22-open-beta': {
    title: 'Open Beta Tales Hero Indonesia Akan Segera Dibuka! — Tales Hero Indonesia',
    description: 'Open Beta Tales Hero Indonesia akan segera hadir. Daftarkan akunmu sekarang dan jadilah yang pertama merasakan petualangan epik bersama teman-temanmu.',
  },
};

const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

for (const [route, meta] of Object.entries(routeMeta)) {
  const fullUrl = `https://taleshero.web.id${route}`;
  const html = baseHtml
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${meta.title}$2`)
    .replace(/(name="description"\s+content=")[^"]*"/, `$1${meta.description}"`)
    .replace(/(property="og:title"\s+content=")[^"]*"/, `$1${meta.title}"`)
    .replace(/(property="og:description"\s+content=")[^"]*"/, `$1${meta.description}"`)
    .replace(/(property="og:url"\s+content=")[^"]*"/, `$1${fullUrl}"`)
    .replace(/(property="og:image"\s+content=")[^"]*"/, `$1${OG_IMAGE}"`)
    .replace(/(rel="canonical"\s+href=")[^"]*"/, `$1${fullUrl}"`)
    .replace(/(name="twitter:title"\s+content=")[^"]*"/, `$1${meta.title}"`)
    .replace(/(name="twitter:description"\s+content=")[^"]*"/, `$1${meta.description}"`)
    .replace(/(name="twitter:image"\s+content=")[^"]*"/, `$1${OG_IMAGE}"`);

  const outDir = join(distDir, route);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
  console.log(`✓ ${route}`);
}

console.log('OG HTML generation complete.');
