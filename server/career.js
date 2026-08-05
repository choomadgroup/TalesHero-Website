// ============================================================
//  Tales Hero Indonesia — Career Applications
// ============================================================

import { isMongoConnected } from './mongodb.js';
import { CareerApplication } from './models/career-application.js';
import { CareerSettings, getPositionSettings } from './models/career-settings.js';
import { getSessionUsername } from './auth/session.js';
import { findUser } from './auth/me.js';

const ALL_POSITIONS = ['Game Master', 'Translator', 'Customer Service', 'Graphics Designer', 'Moderator', 'Developer'];
const COOLDOWN_MS   = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Helper: require login ─────────────────────────────────────────────────────
async function requireAuth(req, res) {
  const username = await getSessionUsername(req);
  if (!username) {
    res.status(401).json({ ok: false, message: 'Kamu harus login terlebih dahulu.' });
    return null;
  }
  const user = await findUser(username);
  if (!user) {
    res.status(401).json({ ok: false, message: 'Akun tidak ditemukan.' });
    return null;
  }
  return user;
}

// ── GET /api/career/positions  (public) ──────────────────────────────────────
export async function getPositions(req, res) {
  if (!isMongoConnected()) {
    // Default: all open when Mongo is unavailable
    const all = Object.fromEntries(ALL_POSITIONS.map(p => [p, true]));
    return res.json({ ok: true, positions: all });
  }
  const positions = await getPositionSettings();
  return res.json({ ok: true, positions });
}

// ── GET /api/career/my-status  (login required) ───────────────────────────────
export async function getMyStatus(req, res) {
  if (!isMongoConnected()) {
    return res.json({ ok: true, canApply: true });
  }
  const user = await requireAuth(req, res);
  if (!user) return;

  // Find most recent application for this account
  const latest = await CareerApplication.findOne({ gameUsername: user.username })
    .sort({ createdAt: -1 })
    .lean();

  if (!latest) return res.json({ ok: true, canApply: true });

  const now = Date.now();

  // Active application (pending/reviewed/accepted) → blocked
  if (['pending', 'reviewed', 'accepted'].includes(latest.status)) {
    return res.json({
      ok: true, canApply: false,
      reason: latest.status,
      application: { position: latest.position, status: latest.status, createdAt: latest.createdAt },
    });
  }

  // Rejected: cooldown from statusUpdatedAt (or createdAt as fallback)
  if (latest.status === 'rejected') {
    const rejectedAt = latest.statusUpdatedAt ? new Date(latest.statusUpdatedAt).getTime()
                                               : new Date(latest.createdAt).getTime();
    const cooldownUntil = rejectedAt + COOLDOWN_MS;
    if (now < cooldownUntil) {
      return res.json({
        ok: true, canApply: false,
        reason: 'cooldown',
        cooldownUntil: new Date(cooldownUntil).toISOString(),
        application: { position: latest.position, status: latest.status, createdAt: latest.createdAt },
      });
    }
  }

  // Also enforce 7-day cooldown from submission regardless of status
  const submittedAt  = new Date(latest.createdAt).getTime();
  const cooldownUntil = submittedAt + COOLDOWN_MS;
  if (now < cooldownUntil) {
    return res.json({
      ok: true, canApply: false,
      reason: 'cooldown',
      cooldownUntil: new Date(cooldownUntil).toISOString(),
      application: { position: latest.position, status: latest.status, createdAt: latest.createdAt },
    });
  }

  return res.json({ ok: true, canApply: true });
}

// ── POST /api/career/apply  (login required) ──────────────────────────────────
export async function submitApplication(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'Layanan lamaran sedang tidak tersedia. Coba lagi nanti.' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const { discord, position, motivation, experience, portfolio } = req.body ?? {};

  if (!discord?.trim() || !position || !motivation?.trim() || !experience?.trim()) {
    return res.status(400).json({ ok: false, message: 'Semua kolom wajib harus diisi.' });
  }
  if (!ALL_POSITIONS.includes(position)) {
    return res.status(400).json({ ok: false, message: 'Posisi tidak valid.' });
  }
  if (motivation.trim().length < 50) {
    return res.status(400).json({ ok: false, message: 'Motivasi minimal 50 karakter.' });
  }

  // Check position availability
  const settings  = await getPositionSettings();
  if (!settings[position]) {
    return res.status(400).json({ ok: false, message: 'Posisi ini sedang tidak membuka lowongan.' });
  }

  // Cooldown check by gameUsername
  const latest = await CareerApplication.findOne({ gameUsername: user.username })
    .sort({ createdAt: -1 }).lean();

  if (latest) {
    if (['pending', 'reviewed', 'accepted'].includes(latest.status)) {
      return res.status(429).json({ ok: false, message: 'Kamu masih memiliki lamaran yang sedang diproses.' });
    }
    const now = Date.now();
    const submittedAt = new Date(latest.createdAt).getTime();
    const rejectedAt  = latest.statusUpdatedAt ? new Date(latest.statusUpdatedAt).getTime() : submittedAt;
    const cooldownBase = Math.max(submittedAt, rejectedAt);
    if (now < cooldownBase + COOLDOWN_MS) {
      const until = new Date(cooldownBase + COOLDOWN_MS);
      return res.status(429).json({
        ok: false,
        message: `Kamu baru bisa melamar kembali setelah ${until.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      });
    }
  }

  const app = await CareerApplication.create({
    gameUsername: user.username,
    nickname:     user.nickname || user.username,
    email:        user.email,
    discord:      discord.trim(),
    position,
    motivation:   motivation.trim(),
    experience:   experience.trim(),
    portfolio:    portfolio?.trim() ?? '',
  });

  return res.json({ ok: true, message: 'Lamaran berhasil dikirim! Kami akan menghubungimu melalui Discord atau Email.', id: app._id });
}

// ── GET /api/admin/career/applications  (admin) ───────────────────────────────
export async function getApplications(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'MongoDB tidak tersedia.' });
  }
  const { status, position, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (status)   filter.status   = status;
  if (position) filter.position = position;

  const total = await CareerApplication.countDocuments(filter);
  const apps  = await CareerApplication.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  return res.json({ ok: true, applications: apps, total, page: Number(page) });
}

// ── PATCH /api/admin/career/applications/:id  (admin) ─────────────────────────
export async function updateApplicationStatus(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'MongoDB tidak tersedia.' });
  }
  const { id } = req.params;
  const { status } = req.body ?? {};
  const ALLOWED = ['pending', 'reviewed', 'accepted', 'rejected'];
  if (!ALLOWED.includes(status)) {
    return res.status(400).json({ ok: false, message: 'Status tidak valid.' });
  }
  const updated = await CareerApplication.findByIdAndUpdate(
    id,
    { status, statusUpdatedAt: new Date() },
    { new: true },
  ).lean();
  if (!updated) return res.status(404).json({ ok: false, message: 'Lamaran tidak ditemukan.' });
  return res.json({ ok: true, application: updated });
}

// ── DELETE /api/admin/career/applications/:id  (admin) ────────────────────────
export async function deleteApplication(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'MongoDB tidak tersedia.' });
  }
  const { id } = req.params;
  const deleted = await CareerApplication.findByIdAndDelete(id).lean();
  if (!deleted) return res.status(404).json({ ok: false, message: 'Lamaran tidak ditemukan.' });
  return res.json({ ok: true });
}

// ── GET /api/admin/career/positions  (admin) ──────────────────────────────────
export async function adminGetPositions(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'MongoDB tidak tersedia.' });
  }
  const positions = await getPositionSettings();
  return res.json({ ok: true, positions });
}

// ── PATCH /api/admin/career/positions/:position  (admin) ─────────────────────
export async function adminUpdatePosition(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'MongoDB tidak tersedia.' });
  }
  const position  = decodeURIComponent(req.params.position);
  const { available } = req.body ?? {};
  if (!ALL_POSITIONS.includes(position)) {
    return res.status(400).json({ ok: false, message: 'Posisi tidak valid.' });
  }
  await CareerSettings.findOneAndUpdate(
    { docId: 'career-settings' },
    { $set: { [`positions.${position}`]: Boolean(available) } },
    { upsert: true },
  );
  return res.json({ ok: true });
}
