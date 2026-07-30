import { useState, useRef, useEffect } from 'react';
import '@/Style/admin.scss';
import { useAdminAuth, useAdminNews, type AdminNewsArticle, type NewsFormData } from '@/Hooks/use-admin-news';

// ── tiny markdown preview (no external dep) ──────────────────────────────────
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`{3}[\s\S]*?`{3}/g, (m) => `<pre><code>${m.slice(3, -3).trim()}</code></pre>`)
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/!\[.*?\]\((.+?)\)/g, '<img src="$1" alt=""/>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hupboi])(.+)$/gm, (line) => line ? `<p>${line}</p>` : '');
}

// ── category helpers ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  update: 'Update',
  info: 'Info',
  maintenance: 'Maintenance',
};

// ── icons (inline SVG to avoid dep) ─────────────────────────────────────────
const IconNews      = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconLogout    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconPlus      = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconRefresh   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;

// ── empty form ────────────────────────────────────────────────────────────────
const emptyForm = (): NewsFormData => ({
  title: '', slug: '', category: 'update', content: '', excerpt: '', coverUrl: '', published: false,
});

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// Login screen
// ─────────────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (pw: string) => Promise<{ ok: boolean; message?: string }> }) {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setLoading(true); setError('');
    const r = await onLogin(pw);
    if (!r.ok) { setError(r.message ?? 'Password salah'); setLoading(false); }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src="/Image/logo-taleshero.png" alt="Tales Hero" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <p>ADMIN PANEL</p>
        </div>
        <h1>Masuk ke Dashboard</h1>
        <form onSubmit={submit}>
          <div className="admin-form-group">
            <label htmlFor="admin-pw">Password Admin</label>
            <input
              id="admin-pw"
              type="password"
              placeholder="Masukkan password admin"
              value={pw}
              onChange={e => setPw(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="admin-login-btn" disabled={loading || !pw.trim()}>
            {loading ? 'Memverifikasi…' : 'Masuk'}
          </button>
          {error && <div className="admin-login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete confirmation modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel, loading }: {
  title: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 }}>
      <div style={{ background:'#fff',borderRadius:12,padding:'28px 32px',maxWidth:380,width:'90%',boxShadow:'0 8px 40px rgba(0,0,0,.15)' }}>
        <h3 style={{ margin:'0 0 10px',fontSize:'1rem',fontWeight:700,color:'#0f172a' }}>Hapus Artikel?</h3>
        <p style={{ margin:'0 0 22px',fontSize:13.5,color:'#64748b',lineHeight:1.55 }}>
          Artikel <strong>"{title}"</strong> akan dihapus permanen dan tidak bisa dipulihkan.
        </p>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <button onClick={onCancel} disabled={loading} className="admin-btn admin-btn--ghost">Batal</button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding:'8px 18px',borderRadius:8,background:'#ef4444',color:'#fff',border:'none',fontWeight:600,fontSize:13,cursor:'pointer',opacity:loading?0.6:1 }}>
            {loading ? 'Menghapus…' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Article editor (create / edit)
// ─────────────────────────────────────────────────────────────────────────────
function ArticleEditor({ initial, onSave, onCancel }: {
  initial?: AdminNewsArticle | null;
  onSave: (data: NewsFormData, asDraft: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<NewsFormData>(() =>
    initial
      ? { title: initial.title, slug: initial.slug, category: initial.category,
          content: initial.content, excerpt: initial.excerpt,
          coverUrl: initial.coverUrl ?? '', published: initial.published }
      : emptyForm()
  );
  const [slugManual, setSlugManual] = useState(!!initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'write'|'preview'>('write');

  const set = (k: keyof NewsFormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleTitle = (v: string) => {
    set('title', v);
    if (!slugManual) set('slug', slugify(v));
  };

  const save = async (asDraft: boolean) => {
    if (!form.title || !form.content || !form.excerpt) {
      setError('Judul, konten, dan ringkasan wajib diisi.'); return;
    }
    setSaving(true); setError('');
    try { await onSave({ ...form, published: !asDraft }, asDraft); }
    catch (e: any) { setError(e.message ?? 'Gagal menyimpan artikel'); setSaving(false); }
  };

  return (
    <div>
      {/* topbar */}
      <div className="admin-topbar">
        <h1>{initial ? 'Edit Artikel' : 'Artikel Baru'}</h1>
        <div className="admin-topbar__actions">
          <button className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={saving}>← Kembali</button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="admin-error">{error}</div>}

        <div className="admin-editor">
          {/* form + preview */}
          <div className="admin-editor__body">
            {/* left: form */}
            <div className="admin-editor__form">
              <div className="admin-form-field">
                <label>Judul <span className="required">*</span></label>
                <input value={form.title} onChange={e => handleTitle(e.target.value)} placeholder="Judul artikel" />
              </div>
              <div className="admin-form-field">
                <label>Slug (URL)</label>
                <input value={form.slug} onChange={e => { setSlugManual(true); set('slug', e.target.value); }} placeholder="otomatis dari judul" />
                <div className="helper">Hanya huruf kecil, angka, dan tanda hubung</div>
              </div>
              <div className="admin-form-field">
                <label>Kategori <span className="required">*</span></label>
                <select value={form.category} onChange={e => set('category', e.target.value as NewsFormData['category'])}>
                  <option value="update">Update</option>
                  <option value="info">Info</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label>URL Cover (opsional)</label>
                <input value={form.coverUrl} onChange={e => set('coverUrl', e.target.value)} placeholder="https://…" />
              </div>
              <div className="admin-form-field">
                <label>Ringkasan <span className="required">*</span></label>
                <textarea
                  className="excerpt-editor"
                  value={form.excerpt}
                  onChange={e => set('excerpt', e.target.value)}
                  placeholder="Ringkasan singkat (tampil di daftar berita)"
                />
              </div>
              <div className="admin-form-field">
                <label>Konten (Markdown) <span className="required">*</span></label>
                <div style={{ display:'flex',gap:8,marginBottom:8 }}>
                  <button type="button" onClick={() => setTab('write')}
                    style={{ padding:'4px 12px',borderRadius:6,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,background:tab==='write'?'#6366f1':'#f1f5f9',color:tab==='write'?'#fff':'#374151' }}>
                    Tulis
                  </button>
                  <button type="button" onClick={() => setTab('preview')}
                    style={{ padding:'4px 12px',borderRadius:6,border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:12,fontWeight:600,background:tab==='preview'?'#6366f1':'#f1f5f9',color:tab==='preview'?'#fff':'#374151' }}>
                    Preview
                  </button>
                </div>
                {tab === 'write' ? (
                  <textarea
                    className="content-editor"
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                    placeholder="Tulis konten artikel dalam format Markdown…"
                  />
                ) : (
                  <div className="preview-content"
                    style={{ minHeight:300,border:'1.5px solid #e2e8f0',borderRadius:8,padding:'10px 14px',background:'#fafafa' }}
                    dangerouslySetInnerHTML={{ __html: form.content ? renderMarkdown(form.content) : '<p style="color:#94a3b8">Tidak ada konten untuk dipratinjau</p>' }}
                  />
                )}
              </div>
            </div>

            {/* right: live preview panel (desktop only) */}
            <div className="admin-editor__preview">
              <h3>Pratinjau Langsung</h3>
              {form.coverUrl && (
                <img src={form.coverUrl} alt="" style={{ width:'100%',borderRadius:8,marginBottom:12,objectFit:'cover',maxHeight:160 }} />
              )}
              {form.title && <h2 style={{ fontSize:'1.05rem',fontWeight:700,color:'#0f172a',margin:'0 0 8px' }}>{form.title}</h2>}
              {form.excerpt && <p style={{ fontSize:13,color:'#64748b',marginBottom:12,lineHeight:1.55 }}>{form.excerpt}</p>}
              {form.category && (
                <span className={`admin-cat-badge admin-cat-badge--${form.category}`} style={{ marginBottom:14,display:'inline-flex' }}>
                  {CATEGORY_LABELS[form.category]}
                </span>
              )}
              {form.content && (
                <div className="preview-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
                />
              )}
            </div>
          </div>

          {/* footer */}
          <div className="admin-editor__footer">
            <button className="btn-draft" disabled={saving} onClick={() => save(true)}>
              {saving ? 'Menyimpan…' : 'Simpan sebagai Draft'}
            </button>
            <button className="btn-save-publish" disabled={saving} onClick={() => save(false)}>
              {saving ? 'Menyimpan…' : (initial ? 'Simpan Perubahan' : 'Simpan & Publikasikan')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Article list
// ─────────────────────────────────────────────────────────────────────────────
function ArticleList({
  articles, loading, onNew, onEdit, onDelete, onTogglePublish, onRefresh,
}: {
  articles: AdminNewsArticle[];
  loading: boolean;
  onNew: () => void;
  onEdit: (a: AdminNewsArticle) => void;
  onDelete: (a: AdminNewsArticle) => void;
  onTogglePublish: (a: AdminNewsArticle) => void;
  onRefresh: () => void;
}) {
  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div>
      <div className="admin-topbar">
        <h1>Manajemen Berita</h1>
        <div className="admin-topbar__actions">
          <button className="admin-btn admin-btn--ghost" onClick={onRefresh} title="Refresh">
            <IconRefresh /> Refresh
          </button>
          <button className="admin-btn admin-btn--primary" onClick={onNew}>
            <IconPlus /> Artikel Baru
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-article-list">
          <div className="admin-article-list__header">
            <h2>Semua Artikel <span style={{ color:'#94a3b8',fontWeight:400 }}>({articles.length})</span></h2>
          </div>

          {loading ? (
            <div className="admin-loading">Memuat artikel…</div>
          ) : articles.length === 0 ? (
            <div className="admin-article-list__empty">
              <IconNews />
              <p>Belum ada artikel. Buat yang pertama!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th style={{ width: 200 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a._id}>
                    <td><div className="admin-article-title" title={a.title}>{a.title}</div></td>
                    <td>
                      <span className={`admin-cat-badge admin-cat-badge--${a.category}`}>
                        {CATEGORY_LABELS[a.category] ?? a.category}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge admin-status-badge--${a.published ? 'published' : 'draft'}`}>
                        <span className="dot" />
                        {a.published ? 'Dipublikasi' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {fmt(a.publishedAt ?? a.createdAt)}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn-edit"    onClick={() => onEdit(a)}>Edit</button>
                        <button
                          className={a.published ? 'btn-unpublish' : 'btn-publish'}
                          onClick={() => onTogglePublish(a)}
                        >
                          {a.published ? 'Sembunyikan' : 'Publikasikan'}
                        </button>
                        <button className="btn-delete"  onClick={() => onDelete(a)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard shell
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { articles, loading, refresh, create, update, remove, togglePublish } = useAdminNews();
  const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
  const [editing, setEditing] = useState<AdminNewsArticle | null>(null);
  const [deleting, setDeleting] = useState<AdminNewsArticle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleSave = async (data: NewsFormData, asDraft: boolean) => {
    const payload = { ...data, published: !asDraft };
    if (view === 'edit' && editing) {
      await update(editing._id, payload);
      showToast('Artikel berhasil diperbarui.');
    } else {
      await create(payload);
      showToast('Artikel berhasil dibuat.');
    }
    setView('list');
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try { await remove(deleting._id); showToast('Artikel berhasil dihapus.'); }
    finally { setDeleteLoading(false); setDeleting(null); }
  };

  const handleToggle = async (a: AdminNewsArticle) => {
    try { await togglePublish(a); showToast(a.published ? 'Artikel disembunyikan.' : 'Artikel dipublikasikan.'); }
    catch { showToast('Gagal mengubah status.'); }
  };

  return (
    <div className="admin-layout">
      {/* sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/Image/logo-taleshero.png" alt="Tales Hero" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span>Admin Panel</span>
        </div>
        <nav className="admin-sidebar__nav">
          <button className={`admin-nav-link${view !== 'edit' ? ' admin-nav-link--active' : ''}`}
            onClick={() => { setView('list'); setEditing(null); }}>
            <IconNews /> Berita
          </button>
        </nav>
        <div className="admin-sidebar__footer">
          <button className="admin-nav-link" onClick={onLogout}>
            <IconLogout /> Keluar
          </button>
        </div>
      </aside>

      {/* main area */}
      <main className="admin-main">
        {view === 'list' && (
          <ArticleList
            articles={articles}
            loading={loading}
            onNew={() => { setEditing(null); setView('new'); }}
            onEdit={a => { setEditing(a); setView('edit'); }}
            onDelete={a => setDeleting(a)}
            onTogglePublish={handleToggle}
            onRefresh={refresh}
          />
        )}
        {(view === 'new' || view === 'edit') && (
          <ArticleEditor
            initial={view === 'edit' ? editing : null}
            onSave={handleSave}
            onCancel={() => { setView('list'); setEditing(null); }}
          />
        )}
      </main>

      {/* delete modal */}
      {deleting && (
        <DeleteModal
          title={deleting.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}

      {/* toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, right:24, background:'#0f172a', color:'#fff',
          padding:'11px 20px', borderRadius:10, fontSize:13.5, fontWeight:500,
          boxShadow:'0 4px 24px rgba(0,0,0,.25)', zIndex:300, fontFamily:'Poppins,sans-serif',
          animation:'fadeIn .2s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export — handles auth gate
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { authenticated, login, logout } = useAdminAuth();

  if (authenticated === null) {
    return (
      <div className="admin-loading" style={{ minHeight: '100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Poppins,sans-serif' }}>
        Memuat…
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return <AdminDashboard onLogout={logout} />;
}
