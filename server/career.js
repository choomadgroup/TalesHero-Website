// ============================================================
//  Tales Hero Indonesia — Career Applications
// ============================================================

import { isMongoConnected } from './mongodb.js';
import { CareerApplication } from './models/career-application.js';

const ALLOWED_POSITIONS = ['Game Master', 'Translator', 'Customer Service', 'Graphics Designer', 'Moderator'];

// ── POST /api/career/apply ────────────────────────────────────────────────────
export async function submitApplication(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'Layanan lamaran sedang tidak tersedia. Coba lagi nanti.' });
  }

  const { fullName, username, email, discord, position, motivation, experience, portfolio } = req.body ?? {};

  if (!fullName?.trim() || !username?.trim() || !email?.trim() || !discord?.trim() || !position || !motivation?.trim() || !experience?.trim()) {
    return res.status(400).json({ ok: false, message: 'Semua kolom wajib harus diisi.' });
  }
  if (!ALLOWED_POSITIONS.includes(position)) {
    return res.status(400).json({ ok: false, message: 'Posisi tidak valid.' });
  }
  if (motivation.trim().length < 50) {
    return res.status(400).json({ ok: false, message: 'Motivasi minimal 50 karakter.' });
  }

  // Prevent duplicate: same email + position within 7 days
  const recent = await CareerApplication.findOne({
    email: email.trim().toLowerCase(),
    position,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });
  if (recent) {
    return res.status(429).json({ ok: false, message: 'Kamu sudah mengirim lamaran untuk posisi ini dalam 7 hari terakhir.' });
  }

  const app = await CareerApplication.create({
    fullName:   fullName.trim(),
    username:   username.trim(),
    email:      email.trim().toLowerCase(),
    discord:    discord.trim(),
    position,
    motivation: motivation.trim(),
    experience: experience.trim(),
    portfolio:  portfolio?.trim() ?? '',
  });

  return res.json({ ok: true, message: 'Lamaran berhasil dikirim! Kami akan menghubungimu melalui Discord atau Email.', id: app._id });
}

// ── GET /api/career/applications  (admin only) ────────────────────────────────
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

// ── PATCH /api/career/applications/:id  (admin only) ─────────────────────────
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
  const updated = await CareerApplication.findByIdAndUpdate(id, { status }, { new: true }).lean();
  if (!updated) return res.status(404).json({ ok: false, message: 'Lamaran tidak ditemukan.' });
  return res.json({ ok: true, application: updated });
}

// ── DELETE /api/career/applications/:id  (admin only) ────────────────────────
export async function deleteApplication(req, res) {
  if (!isMongoConnected()) {
    return res.status(503).json({ ok: false, message: 'MongoDB tidak tersedia.' });
  }
  const { id } = req.params;
  const deleted = await CareerApplication.findByIdAndDelete(id).lean();
  if (!deleted) return res.status(404).json({ ok: false, message: 'Lamaran tidak ditemukan.' });
  return res.json({ ok: true });
}
