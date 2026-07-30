import crypto from 'node:crypto';
import { NewsArticle }        from './models/news-article.js';
import { isAdminAuthenticated, getAdminUser, setAdminCookie, clearAdminCookie, STAFF_ROLES } from './admin-session.js';
import { isMongoConnected }   from './mongodb.js';
import { query }              from './db.js';

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

/**
 * Login admin via akun staf game (MySQL).
 * Verifikasi: password MD5 di userinfofrompublisher + fdRole di userinfo harus
 * Owner / Staff / GM.
 */
export async function adminLogin(req, res) {
  const { username, password } = req.body ?? {};
  if (!username?.trim()) { json(res, 400, { message: 'Username wajib diisi' }); return; }
  if (!password)         { json(res, 400, { message: 'Password wajib diisi' }); return; }

  try {
    // Ambil data login + role dari tabel game
    const rows = await query(
      `SELECT g.fdUserID, g.fdPassword,
              i.fdNickname, i.fdRole
       FROM userinfofrompublisher g
       JOIN userinfo i ON i.fdUID = g.fdUserID
       WHERE g.fdUserID = ?
       LIMIT 1`,
      [username.trim()],
    );

    if (rows.length === 0) {
      json(res, 401, { message: 'Username atau password salah' }); return;
    }

    const row = rows[0];

    // Verifikasi password — game menyimpan MD5
    const md5 = crypto.createHash('md5').update(password, 'utf8').digest('hex');
    if (md5 !== row.fdPassword) {
      json(res, 401, { message: 'Username atau password salah' }); return;
    }

    // Cek role — hanya Owner, Staff, GM yang boleh masuk
    if (!STAFF_ROLES.has(row.fdRole)) {
      json(res, 403, { message: 'Akun ini tidak memiliki akses ke dashboard admin' }); return;
    }

    const user = {
      username: row.fdUserID,
      nickname: row.fdNickname ?? row.fdUserID,
      role:     row.fdRole,
    };

    setAdminCookie(res, user);
    json(res, 200, { ok: true, user });
  } catch (err) {
    console.error('[adminLogin]', err.message);
    json(res, 500, { message: 'Terjadi kesalahan server' });
  }
}

export function adminLogout(req, res) {
  clearAdminCookie(res);
  json(res, 200, { ok: true });
}

export function adminMe(req, res) {
  const user = getAdminUser(req);
  if (!user) { json(res, 401, { authenticated: false }); return; }
  json(res, 200, { authenticated: true, user });
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
