import { DownloadPackage } from './models/download-package.js';
import { isAdminAuthenticated } from './admin-session.js';
import { isMongoConnected }     from './mongodb.js';

// Static package metadata (label/desc/features never change from admin)
const DEFAULTS = {
  setup: {
    label:    'File Setup',
    desc:     'Installer lengkap untuk instalasi pertama kali. Cocok untuk pemain baru.',
    size:     '~500 MB',
    features: ['Installer otomatis', 'Semua file game', 'Langsung bisa main'],
    color:    '#fab005',
  },
  fullclient: {
    label:    'Full Client',
    desc:     'Paket lengkap tanpa installer. Ekstrak dan langsung jalankan.',
    size:     '~1.2 GB',
    features: ['Tanpa installer', 'Portable', 'Ideal untuk reinstall'],
    color:    '#4dabf7',
  },
  patch: {
    label:    'Manual Patch',
    desc:     'Patch terbaru untuk pemain yang sudah punya game sebelumnya.',
    size:     '~50 MB',
    features: ['Update incremental', 'Ukuran kecil', 'Hanya file terbaru'],
    color:    '#69db7c',
  },
};

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function merge(id, doc) {
  const def = DEFAULTS[id] ?? {};
  return {
    id,
    label:     def.label,
    desc:      def.desc,
    features:  def.features,
    color:     def.color,
    href:      doc?.href      ?? '',
    size:      doc?.size      || def.size,
    available: doc?.available ?? false,
  };
}

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export async function publicGetDownloads(req, res) {
  const ids = ['setup', 'fullclient', 'patch'];

  if (!isMongoConnected()) {
    // Return defaults when MongoDB is offline — page still renders
    return json(res, 200, ids.map(id => merge(id, null)));
  }

  try {
    const docs = await DownloadPackage.find({ id: { $in: ids } }).lean();
    const map  = Object.fromEntries(docs.map(d => [d.id, d]));
    json(res, 200, ids.map(id => merge(id, map[id])));
  } catch (err) {
    console.error('[downloads] publicGetDownloads:', err.message);
    json(res, 200, ids.map(id => merge(id, null)));
  }
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────

export async function adminGetDownloads(req, res) {
  if (!isAdminAuthenticated(req)) { json(res, 401, { message: 'Unauthorized' }); return; }
  if (!isMongoConnected())        { json(res, 503, { message: 'MongoDB tidak terhubung' }); return; }

  const ids  = ['setup', 'fullclient', 'patch'];
  try {
    const docs = await DownloadPackage.find({ id: { $in: ids } }).lean();
    const map  = Object.fromEntries(docs.map(d => [d.id, d]));
    json(res, 200, ids.map(id => merge(id, map[id])));
  } catch (err) {
    console.error('[downloads] adminGetDownloads:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

export async function adminUpdateDownload(req, res, id) {
  if (!isAdminAuthenticated(req)) { json(res, 401, { message: 'Unauthorized' }); return; }
  if (!isMongoConnected())        { json(res, 503, { message: 'MongoDB tidak terhubung' }); return; }
  if (!DEFAULTS[id])              { json(res, 400, { message: 'ID tidak valid' }); return; }

  const { href, size, available } = req.body ?? {};
  const updates = {};
  if (href      !== undefined) updates.href      = String(href).trim();
  if (size      !== undefined) updates.size      = String(size).trim();
  if (available !== undefined) updates.available = !!available;

  try {
    const doc = await DownloadPackage.findOneAndUpdate(
      { id },
      { $set: updates },
      { upsert: true, returnDocument: 'after' },
    ).lean();
    json(res, 200, merge(id, doc));
  } catch (err) {
    console.error('[downloads] adminUpdateDownload:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}
