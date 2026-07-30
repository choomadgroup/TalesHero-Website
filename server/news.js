import crypto from 'node:crypto';
import { NewsArticle }        from './models/news-article.js';
import { isAdminAuthenticated, setAdminCookie, clearAdminCookie } from './admin-session.js';
import { isMongoConnected }   from './mongodb.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function estimateReadTime(content = '') {
  return Math.max(1, Math.ceil(
    content.replace(/[#*`_[\]()]/g, ' ').trim().split(/\s+/).length / 200,
  ));
}

function slugify(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 80);
}

// ── PUBLIC ────────────────────────────────────────────────────────────────────

export async function publicGetNews(req, res) {
  if (!isMongoConnected()) { json(res, 200, []); return; }
  try {
    const articles = await NewsArticle
      .find({ published: true })
      .select('title slug category tags excerpt coverUrl readTime publishedAt createdAt viewCount reactions')
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();
    json(res, 200, articles);
  } catch (err) {
    console.error('[news] publicGetNews:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

export async function publicGetArticle(req, res, category, slug) {
  if (!isMongoConnected()) { json(res, 404, { message: 'Not found' }); return; }
  try {
    const article = await NewsArticle.findOne({ category, slug, published: true }).lean();
    if (!article) { json(res, 404, { message: 'Not found' }); return; }
    json(res, 200, article);
  } catch (err) {
    console.error('[news] publicGetArticle:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

export async function publicTrackView(req, res, category, slug) {
  if (!isMongoConnected()) { json(res, 200, { viewCount: 0 }); return; }
  try {
    const article = await NewsArticle.findOneAndUpdate(
      { category, slug, published: true },
      { $inc: { viewCount: 1 } },
      { returnDocument: 'after', select: 'viewCount' },
    ).lean();
    if (!article) { json(res, 404, { message: 'Not found' }); return; }
    json(res, 200, { viewCount: article.viewCount ?? 0 });
  } catch (err) {
    console.error('[news] publicTrackView:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

export async function publicReact(req, res, category, slug, body) {
  if (!isMongoConnected()) { json(res, 200, { reactions: { thumbsUp: 0, heart: 0 } }); return; }
  const type = body?.type;
  if (type !== 'thumbsUp' && type !== 'heart') {
    json(res, 400, { message: 'type harus thumbsUp atau heart' }); return;
  }
  try {
    const inc = { [`reactions.${type}`]: 1 };
    const article = await NewsArticle.findOneAndUpdate(
      { category, slug, published: true },
      { $inc: inc },
      { returnDocument: 'after', select: 'reactions' },
    ).lean();
    if (!article) { json(res, 404, { message: 'Not found' }); return; }
    json(res, 200, { reactions: article.reactions ?? { thumbsUp: 0, heart: 0 } });
  } catch (err) {
    console.error('[news] publicReact:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

// ── ADMIN AUTH ────────────────────────────────────────────────────────────────

export function adminLogin(req, res) {
  const { password } = req.body ?? {};
  if (!password) { json(res, 400, { message: 'Password wajib diisi' }); return; }

  const correct = process.env.ADMIN_PASSWORD;
  if (!correct) { json(res, 500, { message: 'Admin belum dikonfigurasi' }); return; }

  const a = Buffer.from(String(password));
  const b = Buffer.from(String(correct));
  const match = a.length === b.length && (() => {
    try { return crypto.timingSafeEqual(a, b); } catch { return false; }
  })();

  if (!match) { json(res, 401, { message: 'Password salah' }); return; }
  setAdminCookie(res);
  json(res, 200, { ok: true });
}

export function adminLogout(req, res) {
  clearAdminCookie(res);
  json(res, 200, { ok: true });
}

export function adminMe(req, res) {
  json(res, isAdminAuthenticated(req) ? 200 : 401, { authenticated: isAdminAuthenticated(req) });
}

// ── ADMIN CRUD ────────────────────────────────────────────────────────────────

export async function adminGetAll(req, res) {
  if (!isAdminAuthenticated(req)) { json(res, 401, { message: 'Unauthorized' }); return; }
  if (!isMongoConnected()) { json(res, 503, { message: 'MongoDB not connected' }); return; }
  try {
    const articles = await NewsArticle.find().sort({ createdAt: -1 }).lean();
    json(res, 200, articles);
  } catch (err) {
    console.error('[news] adminGetAll:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

export async function adminCreate(req, res) {
  if (!isAdminAuthenticated(req)) { json(res, 401, { message: 'Unauthorized' }); return; }
  if (!isMongoConnected()) { json(res, 503, { message: 'MongoDB not connected' }); return; }
  try {
    const { title, slug, category, tags, content, excerpt, coverUrl, published } = req.body ?? {};
    if (!title || !category || !content || !excerpt) {
      json(res, 400, { message: 'title, category, content, excerpt wajib diisi' }); return;
    }
    const article = new NewsArticle({
      title,
      slug:        slug || slugify(title),
      category,
      tags:        Array.isArray(tags) ? tags : (tags ? [tags] : []),
      content,
      excerpt,
      coverUrl:    coverUrl || null,
      readTime:    estimateReadTime(content),
      published:   !!published,
      publishedAt: published ? new Date() : null,
    });
    await article.save();
    json(res, 201, article);
  } catch (err) {
    if (err.code === 11000) { json(res, 409, { message: 'Slug sudah digunakan' }); return; }
    console.error('[news] adminCreate:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

export async function adminUpdate(req, res, id) {
  if (!isAdminAuthenticated(req)) { json(res, 401, { message: 'Unauthorized' }); return; }
  if (!isMongoConnected()) { json(res, 503, { message: 'MongoDB not connected' }); return; }
  try {
    const updates = { ...(req.body ?? {}) };
    if (updates.content) updates.readTime = estimateReadTime(updates.content);
    if (updates.published && !updates.publishedAt) updates.publishedAt = new Date();
    if (updates.published === false) updates.publishedAt = null;
    if (updates.tags !== undefined) {
      updates.tags = Array.isArray(updates.tags) ? updates.tags : (updates.tags ? [updates.tags] : []);
    }
    const article = await NewsArticle.findByIdAndUpdate(id, updates, { new: true });
    if (!article) { json(res, 404, { message: 'Artikel tidak ditemukan' }); return; }
    json(res, 200, article);
  } catch (err) {
    console.error('[news] adminUpdate:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}

export async function adminDelete(req, res, id) {
  if (!isAdminAuthenticated(req)) { json(res, 401, { message: 'Unauthorized' }); return; }
  if (!isMongoConnected()) { json(res, 503, { message: 'MongoDB not connected' }); return; }
  try {
    const article = await NewsArticle.findByIdAndDelete(id);
    if (!article) { json(res, 404, { message: 'Artikel tidak ditemukan' }); return; }
    json(res, 200, { ok: true });
  } catch (err) {
    console.error('[news] adminDelete:', err.message);
    json(res, 500, { message: 'Server error' });
  }
}
