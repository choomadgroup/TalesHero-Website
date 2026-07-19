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
};

const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

for (const [route, meta] of Object.entries(routeMeta)) {
  const html = baseHtml
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${meta.title}$2`)
    .replace(/(name="description"\s+content=")[^"]*"/, `$1${meta.description}"`)
    .replace(/(property="og:title"\s+content=")[^"]*"/, `$1${meta.title}"`)
    .replace(/(property="og:description"\s+content=")[^"]*"/, `$1${meta.description}"`)
    .replace(/(property="og:image"\s+content=")[^"]*"/, `$1${OG_IMAGE}"`)
    .replace(/(name="twitter:title"\s+content=")[^"]*"/, `$1${meta.title}"`)
    .replace(/(name="twitter:description"\s+content=")[^"]*"/, `$1${meta.description}"`)
    .replace(/(name="twitter:image"\s+content=")[^"]*"/, `$1${OG_IMAGE}"`);

  const outDir = join(distDir, route);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
  console.log(`✓ ${route}`);
}

console.log('OG HTML generation complete.');
