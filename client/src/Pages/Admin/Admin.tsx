import { useState, useRef, useEffect, useCallback } from 'react';
import '@/Style/admin.scss';
import { renderMarkdown } from '@/Lib/markdown';
import { useAdminAuth, useAdminNews, type AdminNewsArticle, type NewsFormData, type AdminUser } from '@/Hooks/use-admin-news';
import { useAdminDownloads, type DownloadPackage } from '@/Hooks/use-downloads';
import { useAdminRedeem, searchItems, parseRedeemItems, type RedeemCode, type RedeemFormData, type RedeemItem, type ItemResult } from '@/Hooks/use-admin-redeem';
import { useMusic } from '@/Hooks/use-music';
import { GmPlayerSection, GmRequestsSection, GmLogsSection } from './GmTools';

// ── category helpers ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  update: 'Update',
  info: 'Info',
  maintenance: 'Maintenance',
};

// ── icons (inline SVG to avoid dep) ─────────────────────────────────────────
const IconNews      = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconPlayers   = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M21 21v-2a4 4 0 00-3-3.85"/></svg>;
const IconRequests  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconLog       = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconDownload  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconLogout    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconPlus      = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconRefresh   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IconRedeem    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
const IconAccount   = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconCareer    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;

// ── empty form ────────────────────────────────────────────────────────────────
const emptyForm = (): NewsFormData => ({
  title: '', slug: '', category: 'update', content: '', excerpt: '', coverUrl: '', published: false,
});

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 80);
}

// Role badge colours
const ROLE_COLORS: Record<string, string> = {
  Owner: '#f59e0b',
  Staff: '#6366f1',
  GM:    '#10b981',
};

// ─────────────────────────────────────────────────────────────────────────────
// Login screen
// ─────────────────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: {
  onLogin: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [username, setUsername] = useState('');
  const [pw,       setPw]       = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pw.trim()) return;
    setLoading(true); setError('');
    const r = await onLogin(username.trim(), pw);
    if (!r.ok) { setError(r.message ?? 'Login gagal'); setLoading(false); }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <img src="/Image/logo-taleshero.png" alt="Tales Hero" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <p>ADMIN PANEL</p>
        </div>
        <h1>Masuk ke Dashboard</h1>
        <p style={{ textAlign:'center', fontSize:13, color:'#64748b', marginTop:-16, marginBottom:20 }}>
          Gunakan akun staf game kamu (Owner / Staff / GM)
        </p>
        <form onSubmit={submit}>
          <div className="admin-form-group">
            <label htmlFor="admin-uid">Username Game</label>
            <input id="admin-uid" type="text" placeholder="fdUserID / username game"
              value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
          </div>
          <div className="admin-form-group">
            <label htmlFor="admin-pw">Password</label>
            <input id="admin-pw" type="password" placeholder="Password akun game"
              value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
          </div>
          <button type="submit" className="admin-login-btn" disabled={loading || !username.trim() || !pw.trim()}>
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
function DeleteModal({ title, heading = 'Hapus?', onConfirm, onCancel, loading }: {
  title: string; heading?: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 }}>
      <div style={{ background:'#fff',borderRadius:12,padding:'28px 32px',maxWidth:380,width:'90%',boxShadow:'0 8px 40px rgba(0,0,0,.15)' }}>
        <h3 style={{ margin:'0 0 10px',fontSize:'1rem',fontWeight:700,color:'#0f172a' }}>{heading}</h3>
        <p style={{ margin:'0 0 22px',fontSize:13.5,color:'#64748b',lineHeight:1.55 }}>
          <strong>"{title}"</strong> akan dihapus permanen dan tidak bisa dipulihkan.
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
      <div className="admin-topbar">
        <h1>{initial ? 'Edit Artikel' : 'Artikel Baru'}</h1>
        <div className="admin-topbar__actions">
          <button className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={saving}>Kembali</button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-editor">
          <div className="admin-editor__body">
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
                <textarea className="excerpt-editor" value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                  placeholder="Ringkasan singkat (tampil di daftar berita)" />
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
                  <textarea className="content-editor" value={form.content} onChange={e => set('content', e.target.value)}
                    placeholder="Tulis konten artikel dalam format Markdown…" />
                ) : (
                  <div className="preview-content"
                    style={{ minHeight:300,border:'1.5px solid #e2e8f0',borderRadius:8,padding:'10px 14px',background:'#fafafa' }}
                    dangerouslySetInnerHTML={{ __html: form.content ? renderMarkdown(form.content) : '<p style="color:#94a3b8">Tidak ada konten untuk dipratinjau</p>' }}
                  />
                )}
              </div>
            </div>

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
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }} />
              )}
            </div>
          </div>

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
          <button className="admin-btn admin-btn--ghost" onClick={onRefresh} title="Refresh"><IconRefresh /> Refresh</button>
          <button className="admin-btn admin-btn--primary" onClick={onNew}><IconPlus /> Artikel Baru</button>
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
                  <th>Judul</th><th>Kategori</th><th>Status</th><th>Tanggal</th>
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
                        <span className="dot" />{a.published ? 'Dipublikasi' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>{fmt(a.publishedAt ?? a.createdAt)}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="btn-edit" onClick={() => onEdit(a)}>Edit</button>
                        <button className={a.published ? 'btn-unpublish' : 'btn-publish'} onClick={() => onTogglePublish(a)}>
                          {a.published ? 'Sembunyikan' : 'Publikasikan'}
                        </button>
                        <button className="btn-delete" onClick={() => onDelete(a)}>Hapus</button>
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
// Download manager
// ─────────────────────────────────────────────────────────────────────────────
const PKG_LABELS: Record<string, string> = {
  setup:      'File Setup',
  fullclient: 'Full Client',
  patch:      'Manual Patch',
};
const PKG_COLORS: Record<string, string> = {
  setup: '#fab005', fullclient: '#4dabf7', patch: '#69db7c',
};

function DownloadEditor({ pkg, onSave, onCancel }: {
  pkg: DownloadPackage;
  onSave: (data: { href: string; size: string; available: boolean }) => Promise<void>;
  onCancel: () => void;
}) {
  const [href,      setHref]      = useState(pkg.href);
  const [size,      setSize]      = useState(pkg.size);
  const [available, setAvailable] = useState(pkg.available);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try { await onSave({ href: href.trim(), size: size.trim(), available }); }
    catch (e: any) { setError(e.message ?? 'Gagal menyimpan'); setSaving(false); }
  };

  return (
    <div className="adl-editor">
      <div className="adl-editor__header" style={{ '--pkg-color': PKG_COLORS[pkg.id] } as React.CSSProperties}>
        <span className="adl-editor__label">{PKG_LABELS[pkg.id] ?? pkg.id}</span>
        <button className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={saving}>Batal</button>
      </div>

      {error && <div className="admin-error" style={{ margin:'0 0 12px' }}>{error}</div>}

      <div className="admin-form-field">
        <label>Link Download</label>
        <input value={href} onChange={e => setHref(e.target.value)} placeholder="https://drive.google.com/… atau URL langsung" />
        <div className="helper">URL langsung ke file, atau link Google Drive / OneDrive</div>
      </div>

      <div className="admin-form-field">
        <label>Ukuran File</label>
        <input value={size} onChange={e => setSize(e.target.value)} placeholder="~500 MB" />
      </div>

      <div className="admin-form-field">
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)}
            style={{ width:16,height:16,cursor:'pointer' }} />
          Aktifkan tombol download (hapus "Segera Hadir")
        </label>
        {available && !href.trim() && (
          <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>⚠ Isi link download terlebih dahulu sebelum mengaktifkan</div>
        )}
      </div>

      <button className="btn-save-publish" disabled={saving || (available && !href.trim())} onClick={save}
        style={{ marginTop:4 }}>
        {saving ? 'Menyimpan…' : 'Simpan'}
      </button>
    </div>
  );
}

function DownloadManager({ showToast }: { showToast: (msg: string) => void }) {
  const { packages, loading, error, refresh, update } = useAdminDownloads();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = async (id: string, data: { href: string; size: string; available: boolean }) => {
    await update(id, data);
    showToast('Paket download berhasil diperbarui.');
    setEditingId(null);
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1>Manajemen Download</h1>
        <div className="admin-topbar__actions">
          <button className="admin-btn admin-btn--ghost" onClick={refresh} title="Refresh"><IconRefresh /> Refresh</button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="admin-loading">Memuat data download…</div>
        ) : (
          <div className="adl-list">
            <p className="adl-list__hint">
              Atur link dan status untuk setiap paket download yang tampil di halaman <strong>/download</strong>.
            </p>
            {packages.map(pkg => (
              <div key={pkg.id} className="adl-row">
                {editingId === pkg.id ? (
                  <DownloadEditor
                    pkg={pkg}
                    onSave={data => handleSave(pkg.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="adl-row__info">
                    <div className="adl-row__left">
                      <span className="adl-row__dot" style={{ background: PKG_COLORS[pkg.id] }} />
                      <div>
                        <div className="adl-row__name">{PKG_LABELS[pkg.id] ?? pkg.id}</div>
                        <div className="adl-row__meta">
                          {pkg.size && <span>{pkg.size}</span>}
                          {pkg.href
                            ? <span className="adl-row__url" title={pkg.href}>{pkg.href.slice(0, 50)}{pkg.href.length > 50 ? '…' : ''}</span>
                            : <span style={{ color:'#cbd5e1' }}>Belum ada link</span>
                          }
                        </div>
                      </div>
                    </div>
                    <div className="adl-row__right">
                      <span className={`admin-status-badge admin-status-badge--${pkg.available ? 'published' : 'draft'}`}>
                        <span className="dot" />{pkg.available ? 'Aktif' : 'Coming Soon'}
                      </span>
                      <button className="btn-edit" onClick={() => setEditingId(pkg.id)}>Edit</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Redeem manager
// ─────────────────────────────────────────────────────────────────────────────
const emptyRedeemForm = (): RedeemFormData => ({
  code: '', cash_amount: 0, tr_amount: 0, mau_amount: 0,
  items: [], note: '', expires_days: 7,
});

// ── Item image helper ──────────────────────────────────────────
function ItemImg({ num, size = 36 }: { num: number; size?: number }) {
  return (
    <img
      src={`/Image/Item/${num}.png`}
      alt={`#${num}`}
      width={size} height={size}
      style={{ objectFit:'contain', borderRadius:4, background:'rgba(255,255,255,0.04)', flexShrink:0 }}
      onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
    />
  );
}

// ── Single item picker row inside the form ────────────────────
function ItemPickerRow({ item, onChange, onRemove }: {
  item: RedeemItem;
  onChange: (updated: RedeemItem) => void;
  onRemove: () => void;
}) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<ItemResult[]>([]);
  const [searching, setSearch]  = useState(false);
  const [open, setOpen]         = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearch(true);
      try { setResults(await searchItems(q)); }
      finally { setSearch(false); }
    }, 300);
  };

  const pick = (it: ItemResult) => {
    onChange({ ...item, num: it.fdItemNum, name: it.fdItemName });
    setQuery(it.fdItemName);
    setResults([]);
    setOpen(false);
  };

  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, background:'rgba(0,229,255,0.05)', border:'1px solid rgba(0,229,255,0.18)', borderRadius:8, padding:'10px 12px' }}>
      {/* image */}
      <div style={{ width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {item.num > 0
          ? <ItemImg num={item.num} size={38} />
          : <span style={{ fontSize:22 }}>🎁</span>
        }
      </div>

      {/* fields */}
      <div style={{ flex:1, minWidth:0 }}>
        {item.num > 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'monospace', fontSize:12, color:'#31f2ff', fontWeight:700 }}>#{item.num}</span>
            <span style={{ fontSize:13, color:'#c8d0ff', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</span>
            <button type="button"
              onClick={() => { onChange({ ...item, num: 0, name: '' }); setQuery(''); }}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#6a7494', fontSize:14, padding:'0 2px', lineHeight:1 }}>✕ ganti</button>
          </div>
        ) : (
          <div style={{ position:'relative' }}>
            <input value={query} onChange={e => handleSearch(e.target.value)}
              placeholder="Cari nama atau nomor item…"
              style={{ width:'100%', boxSizing:'border-box' }}
              onFocus={() => query.trim().length >= 2 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)} />
            {open && (searching || results.length > 0 || query.trim().length >= 2) && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#0b0b1e', border:'1px solid rgba(0,229,255,0.2)', borderRadius:8, boxShadow:'0 4px 24px rgba(0,0,0,.6)', zIndex:60, maxHeight:220, overflowY:'auto', marginTop:2 }}>
                {searching && <div style={{ padding:'10px 14px', fontSize:13, color:'#6a7494' }}>Mencari…</div>}
                {!searching && results.length === 0 && query.trim().length >= 2 && (
                  <div style={{ padding:'10px 14px', fontSize:13, color:'#6a7494' }}>Item tidak ditemukan</div>
                )}
                {results.map(it => (
                  <button key={it.fdItemNum} type="button" onMouseDown={() => pick(it)}
                    style={{ display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left', padding:'7px 12px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#c8d0ff' }}
                    onMouseOver={e => (e.currentTarget.style.background='rgba(0,229,255,0.08)')}
                    onMouseOut={e => (e.currentTarget.style.background='none')}>
                    <ItemImg num={it.fdItemNum} size={28} />
                    <span style={{ fontFamily:'monospace', color:'#6a7494', fontSize:11, flexShrink:0 }}>#{it.fdItemNum}</span>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.fdItemName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* delivery select — only shown when item is picked */}
        {item.num > 0 && (
          <div style={{ marginTop:6 }}>
            <select value={item.delivery}
              onChange={e => onChange({ ...item, delivery: e.target.value as 'Giftbox' | 'Warehouse' })}
              style={{ fontSize:12, padding:'3px 8px' }}>
              <option value="Giftbox">📦 Giftbox</option>
              <option value="Warehouse">🏪 Warehouse</option>
            </select>
          </div>
        )}
      </div>

      {/* remove button */}
      <button type="button" onClick={onRemove}
        style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:18, lineHeight:1, padding:'0 2px', flexShrink:0, marginTop:2 }}
        title="Hapus item ini">×</button>
    </div>
  );
}

function RedeemCreateForm({ onSave, onCancel }: {
  onSave: (data: RedeemFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RedeemFormData>(emptyRedeemForm);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = <K extends keyof RedeemFormData>(k: K, v: RedeemFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const addItem = () =>
    setForm(f => ({ ...f, items: [...f.items, { num: 0, name: '', delivery: 'Giftbox' }] }));

  const updateItem = (idx: number, updated: RedeemItem) =>
    setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? updated : it) }));

  const removeItem = (idx: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const save = async () => {
    const validItems = form.items.filter(it => it.num > 0);
    if (form.cash_amount <= 0 && form.tr_amount <= 0 && form.mau_amount <= 0 && validItems.length === 0) {
      setError('Isi minimal satu reward: Cash, TR, MAU, atau Item.'); return;
    }
    setSaving(true); setError('');
    try { await onSave({ ...form, items: validItems }); }
    catch (e: any) { setError(e.message ?? 'Gagal membuat kode'); setSaving(false); }
  };

  return (
    <div style={{ background:'#0d0d20', border:'1px solid rgba(0,229,255,0.18)', borderRadius:12, padding:'24px 28px', marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:'0.95rem', fontWeight:700, color:'#c8d0ff' }}>Buat Kode Redeem Baru</h3>
        <button className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={saving}>Batal</button>
      </div>

      {error && <div className="admin-error" style={{ marginBottom:14 }}>{error}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 20px' }}>
        <div className="admin-form-field" style={{ gridColumn:'1/-1' }}>
          <label>Kode <span style={{ color:'#6a7494', fontWeight:400, fontSize:12 }}>(kosongkan untuk generate otomatis)</span></label>
          <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
            placeholder="TRH-XXXX-XXXX atau kosongkan" style={{ fontFamily:'monospace', letterSpacing:1 }} />
        </div>

        <div className="admin-form-field">
          <label>Cash (fdCash)</label>
          <input type="number" min={0} value={form.cash_amount || ''}
            onChange={e => set('cash_amount', Number(e.target.value))} placeholder="0" />
        </div>

        <div className="admin-form-field">
          <label>TR (Game Money)</label>
          <input type="number" min={0} value={form.tr_amount || ''}
            onChange={e => set('tr_amount', Number(e.target.value))} placeholder="0" />
        </div>

        <div className="admin-form-field" style={{ gridColumn:'1/-1' }}>
          <label>MAU (Point)</label>
          <input type="number" min={0} value={form.mau_amount || ''}
            onChange={e => set('mau_amount', Number(e.target.value))} placeholder="0" />
        </div>

        {/* ── Multi-item section ── */}
        <div style={{ gridColumn:'1/-1' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#6a7494', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              Item Reward <span style={{ color:'#6a7494', fontWeight:400, textTransform:'none', letterSpacing:0 }}>({form.items.length} item)</span>
            </label>
            <button type="button" onClick={addItem}
              style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'#00e5ff', background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>
              <IconPlus /> Tambah Item
            </button>
          </div>
          {form.items.length === 0 ? (
            <div style={{ textAlign:'center', padding:'14px 0', color:'#6a7494', fontSize:13, border:'1px dashed rgba(0,229,255,0.12)', borderRadius:8 }}>
              Klik "Tambah Item" untuk menambahkan item reward
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {form.items.map((it, idx) => (
                <ItemPickerRow key={idx} item={it}
                  onChange={updated => updateItem(idx, updated)}
                  onRemove={() => removeItem(idx)} />
              ))}
            </div>
          )}
        </div>

        <div className="admin-form-field">
          <label>Berlaku (hari)</label>
          <input type="number" min={1} max={365} value={form.expires_days}
            onChange={e => set('expires_days', Math.max(1, Number(e.target.value)))} />
        </div>

        <div className="admin-form-field">
          <label>Catatan internal <span style={{ color:'#6a7494', fontWeight:400, fontSize:12 }}>(opsional)</span></label>
          <input value={form.note} onChange={e => set('note', e.target.value)} placeholder="Misal: event ulang tahun server" />
        </div>
      </div>

      <div style={{ marginTop:18, display:'flex', justifyContent:'flex-end' }}>
        <button className="btn-save-publish" disabled={saving} onClick={save} style={{ minWidth:160 }}>
          {saving ? 'Membuat…' : 'Buat Kode'}
        </button>
      </div>
    </div>
  );
}

function RedeemManager({ adminUser, showToast }: { adminUser: AdminUser | null; showToast: (msg: string) => void }) {
  const { codes, loading, refresh, create, toggle, deleteCode } = useAdminRedeem();
  const [showForm, setShowForm]           = useState(false);
  const [copiedId, setCopiedId]           = useState<number | null>(null);
  const [deletingCode, setDeletingCode]   = useState<RedeemCode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const isOwner = adminUser?.role === 'Owner';

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  const fmt       = (d?: string | null) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';
  const isExpired = (d?: string | null) => d ? new Date(d) < new Date() : false;

  const handleCreate = async (data: RedeemFormData) => {
    await create(data);
    showToast('Kode redeem berhasil dibuat!');
    setShowForm(false);
  };

  const handleToggle = async (c: RedeemCode) => {
    try {
      await toggle(c.fdRedeemId);
      showToast(c.fdIsActive ? 'Kode dinonaktifkan.' : 'Kode diaktifkan.');
    } catch (e: any) { showToast(e.message ?? 'Gagal mengubah status.'); }
  };

  const handleDelete = async () => {
    if (!deletingCode) return;
    setDeleteLoading(true);
    try {
      await deleteCode(deletingCode.fdRedeemId);
      showToast('Kode berhasil dihapus.');
    } catch (e: any) { showToast(e.message ?? 'Gagal menghapus kode.'); }
    finally { setDeleteLoading(false); setDeletingCode(null); }
  };

  return (
    <>
    {deletingCode && (
      <DeleteModal
        heading="Hapus Kode Redeem?"
        title={deletingCode.fdCode}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCode(null)}
        loading={deleteLoading}
      />
    )}
    <div>
      <div className="admin-topbar">
        <h1>Manajemen Redeem Code</h1>
        <div className="admin-topbar__actions">
          <button className="admin-btn admin-btn--ghost" onClick={refresh} title="Refresh"><IconRefresh /> Refresh</button>
          {isOwner && !showForm && (
            <button className="admin-btn admin-btn--primary" onClick={() => setShowForm(true)}><IconPlus /> Kode Baru</button>
          )}
        </div>
      </div>

      <div className="admin-content">
        {!isOwner && (
          <div style={{ padding:'12px 16px', background:'#fef9c3', border:'1px solid #fde047', borderRadius:8, fontSize:13, color:'#713f12', marginBottom:20 }}>
            Hanya <strong>Owner</strong> yang dapat membuat atau mengubah kode redeem.
          </div>
        )}

        {isOwner && showForm && (
          <RedeemCreateForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        )}

        {loading ? (
          <div className="admin-loading">Memuat kode redeem…</div>
        ) : codes.length === 0 ? (
          <div className="admin-article-list__empty">
            <IconRedeem />
            <p>Belum ada kode redeem. {isOwner ? 'Buat yang pertama!' : ''}</p>
          </div>
        ) : (
          <div className="admin-article-list">
            <div className="admin-article-list__header">
              <h2>Semua Kode <span style={{ color:'#94a3b8', fontWeight:400 }}>({codes.length})</span></h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Reward</th>
                  <th>Klaim</th>
                  <th>Berlaku hingga</th>
                  <th>Dibuat oleh</th>
                  <th>Status</th>
                  {isOwner && <th style={{ width:120 }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {codes.map(c => {
                  const expired = isExpired(c.fdExpiredAt);
                  const active  = !!c.fdIsActive && !expired;
                  return (
                    <tr key={c.fdRedeemId}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <code style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#6366f1', background:'#eef2ff', padding:'2px 6px', borderRadius:5 }}>
                            {c.fdCode}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyCode(c.fdCode, c.fdRedeemId)}
                            title="Salin kode"
                            style={{ background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:4, color: copiedId === c.fdRedeemId ? '#22c55e' : '#94a3b8', transition:'color .15s', lineHeight:1, flexShrink:0 }}
                          >
                            {copiedId === c.fdRedeemId
                              ? <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                              : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            }
                          </button>
                        </div>
                        {c.fdNote && <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{c.fdNote}</div>}
                      </td>
                      <td style={{ fontSize:12.5, lineHeight:1.7 }}>
                        {c.fdRewardCash  > 0 && <div>💰 {c.fdRewardCash.toLocaleString('id-ID')} Cash</div>}
                        {c.fdRewardTR    > 0 && <div>⚔ {c.fdRewardTR.toLocaleString('id-ID')} TR</div>}
                        {c.fdRewardMAU   > 0 && <div>✨ {c.fdRewardMAU.toLocaleString('id-ID')} MAU</div>}
                        {parseRedeemItems(c).map((it, idx) => (
                          <div key={idx} style={{ display:'flex', alignItems:'center', gap:5 }} title={`#${it.num}`}>
                            <ItemImg num={it.num} size={20} />
                            <span>{it.name}</span>
                            <span style={{ color:'#94a3b8', fontSize:11 }}>({it.delivery})</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ fontSize:13, textAlign:'center', fontWeight:600, color: c.fdClaimCount > 0 ? '#c8d0ff' : '#3a4060' }}>
                        {c.fdClaimCount}
                      </td>
                      <td style={{ fontSize:12, color: expired ? '#ef4444' : '#64748b' }}>
                        {fmt(c.fdExpiredAt)}
                        {expired && <div style={{ fontSize:11, color:'#ef4444' }}>Kedaluwarsa</div>}
                      </td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{c.fdCreatedByNickname}</td>
                      <td>
                        <span className={`admin-status-badge admin-status-badge--${active ? 'published' : 'draft'}`}>
                          <span className="dot" />
                          {expired ? 'Kedaluwarsa' : (c.fdIsActive ? 'Aktif' : 'Nonaktif')}
                        </span>
                      </td>
                      {isOwner && (
                        <td>
                          <div className="admin-actions">
                            <button
                              className={c.fdIsActive ? 'btn-unpublish' : 'btn-publish'}
                              onClick={() => handleToggle(c)}
                              disabled={expired}>
                              {c.fdIsActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button className="btn-delete" onClick={() => setDeletingCode(c)}>Hapus</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Account section — admin can change own nickname / password / email / sec-Q
// ─────────────────────────────────────────────────────────────────────────────
const SECURITY_QUESTIONS = [
  'Nama hewan kesayangan kamu?',
  'Warna apa yang kamu suka?',
  'Apa nama panggilan kamu?',
];

function AccountSection({ adminUser, showToast }: {
  adminUser: AdminUser | null;
  showToast: (msg: string) => void;
}) {
  const [data, setData]       = useState<{ nickname: string; email: string; sec_question: string } | null>(null);
  const [pageLoad, setPageLoad] = useState(true);

  const [newNick,   setNewNick]   = useState('');
  const [nickBusy,  setNickBusy]  = useState(false);
  const [nickErr,   setNickErr]   = useState('');

  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwBusy,    setPwBusy]    = useState(false);
  const [pwErr,     setPwErr]     = useState('');

  const [email,     setEmail]     = useState('');
  const [secQ,      setSecQ]      = useState('');
  const [secA,      setSecA]      = useState('');
  const [profBusy,  setProfBusy]  = useState(false);
  const [profErr,   setProfErr]   = useState('');

  useEffect(() => {
    fetch('/api/admin/gm/account', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setNewNick(d.nickname ?? '');
        setEmail(d.email ?? '');
        setSecQ(d.sec_question ?? '');
      })
      .catch(() => setData(null))
      .finally(() => setPageLoad(false));
  }, []);

  const api = async (
    url: string, body: object,
    setBusy: (v: boolean) => void,
    setErr:  (v: string) => void,
    onOk?: (b: any) => void,
  ) => {
    setBusy(true); setErr('');
    try {
      const r    = await fetch(url, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await r.json();
      if (!r.ok) throw new Error(json.message);
      showToast(json.message ?? 'Berhasil.');
      onOk?.(json);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const changeNickname = () =>
    api('/api/admin/gm/account/nickname', { nickname: newNick },
      setNickBusy, setNickErr,
      (b) => setData(d => d ? { ...d, nickname: b.nickname } : null));

  const changePassword = () =>
    api('/api/admin/gm/account/password', { newPassword: newPw, confirmPassword: confirmPw },
      setPwBusy, setPwErr,
      () => { setNewPw(''); setConfirmPw(''); });

  const updateProfile = () =>
    api('/api/admin/gm/account/profile', { email, sec_question: secQ, sec_answer: secA },
      setProfBusy, setProfErr,
      () => { setSecA(''); setData(d => d ? { ...d, email, sec_question: secQ } : null); });

  return (
    <div>
      <div className="admin-topbar"><h1>Akun Saya</h1></div>
      <div className="admin-content">
        {pageLoad ? (
          <div className="admin-loading">Memuat info akun…</div>
        ) : (
          <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Info card */}
            {data && (
              <div style={{ background: '#0d0d20', border: '1px solid rgba(0,229,255,0.14)', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6a7494', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Info Akun</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#c8d0ff' }}>
                  {data.nickname}
                  <span style={{ marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
                    background: ROLE_COLORS[adminUser?.role ?? ''] ?? '#64748b', color: '#fff', verticalAlign: 'middle' }}>
                    {adminUser?.role}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6a7494', marginTop: 4 }}>@{adminUser?.username}</div>
                {data.email && <div style={{ fontSize: 12, color: '#6a7494', marginTop: 2 }}>📧 {data.email}</div>}
                {data.sec_question && <div style={{ fontSize: 12, color: '#6a7494', marginTop: 2 }}>🔐 {data.sec_question}</div>}
              </div>
            )}

            {/* Change Nickname */}
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 13.5, color: '#c8d0ff' }}>✏️ Ubah Nickname</div>
              {nickErr && <div className="admin-error" style={{ marginBottom: 10 }}>{nickErr}</div>}
              <div className="admin-form-field">
                <label>Nickname Baru</label>
                <input value={newNick} onChange={e => setNewNick(e.target.value)} placeholder="Nickname baru (min 3 karakter)" />
              </div>
              <button className="btn-save-publish" disabled={nickBusy || newNick.trim().length < 3} onClick={changeNickname} style={{ marginTop: 4 }}>
                {nickBusy ? 'Menyimpan…' : '✓ Simpan Nickname'}
              </button>
            </div>

            {/* Change Password */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13.5, color: '#c8d0ff' }}>🔑 Ubah Password</div>
              <div style={{ fontSize: 12, color: '#6a7494', marginBottom: 14 }}>
                Min 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol.
              </div>
              {pwErr && <div className="admin-error" style={{ marginBottom: 10 }}>{pwErr}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                <div className="admin-form-field">
                  <label>Password Baru</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Password baru" />
                </div>
                <div className="admin-form-field">
                  <label>Konfirmasi Password</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Ulang password baru" />
                </div>
              </div>
              <button className="btn-save-publish" disabled={pwBusy || !newPw || !confirmPw} onClick={changePassword} style={{ marginTop: 4 }}>
                {pwBusy ? 'Menyimpan…' : '🔑 Ubah Password'}
              </button>
            </div>

            {/* Email & Security Question */}
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13.5, color: '#c8d0ff' }}>📧 Email & Pertanyaan Keamanan</div>
              <div style={{ fontSize: 12, color: '#6a7494', marginBottom: 14 }}>
                Digunakan untuk verifikasi dan pemulihan akun. Wajib diisi untuk mengaktifkan fitur keamanan.
              </div>
              {profErr && <div className="admin-error" style={{ marginBottom: 10 }}>{profErr}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="admin-form-field">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@kamu.com" />
                </div>
                <div className="admin-form-field">
                  <label>Pertanyaan Keamanan</label>
                  <select value={secQ} onChange={e => setSecQ(e.target.value)}>
                    <option value="">-- Pilih Pertanyaan --</option>
                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div className="admin-form-field">
                  <label>Jawaban Keamanan</label>
                  <input type="text" value={secA} onChange={e => setSecA(e.target.value)} placeholder="Jawaban (selalu dibutuhkan saat mengubah)" />
                </div>
              </div>
              <button className="btn-save-publish" disabled={profBusy || !email || !secQ || !secA} onClick={updateProfile} style={{ marginTop: 4 }}>
                {profBusy ? 'Menyimpan…' : '✓ Simpan Profil'}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Career Applications section
// ─────────────────────────────────────────────────────────────────────────────
interface CareerApp {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  discord: string;
  position: string;
  motivation: string;
  experience: string;
  portfolio: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:  '#f59e0b',
  reviewed: '#3b82f6',
  accepted: '#10b981',
  rejected: '#ef4444',
};
const STATUS_LABELS: Record<string, string> = {
  pending:  'Menunggu',
  reviewed: 'Ditinjau',
  accepted: 'Diterima',
  rejected: 'Ditolak',
};

function CareerSection({ showToast }: { showToast: (m: string) => void }) {
  const [apps, setApps]             = useState<CareerApp[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [filterPos, setFilterPos]   = useState('');
  const [filterSt, setFilterSt]     = useState('');
  const [expanded, setExpanded]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPos) params.set('position', filterPos);
      if (filterSt)  params.set('status', filterSt);
      const r = await fetch(`/api/admin/career/applications?${params}`);
      const d = await r.json();
      if (d.ok) { setApps(d.applications); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [filterPos, filterSt]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    const r = await fetch(`/api/admin/career/applications/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const d = await r.json();
    if (d.ok) { showToast(`Status diubah: ${STATUS_LABELS[status]}`); load(); }
    else showToast(d.message ?? 'Gagal mengubah status.');
  };

  const deleteApp = async (id: string, name: string) => {
    if (!confirm(`Hapus lamaran dari ${name}?`)) return;
    const r = await fetch(`/api/admin/career/applications/${id}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) { showToast('Lamaran dihapus.'); load(); }
    else showToast(d.message ?? 'Gagal menghapus.');
  };

  const POSITIONS = ['Game Master','Translator','Customer Service','Graphics Designer','Moderator'];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins,sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#c8d0ff' }}>Lamaran Karir</h2>
        <span style={{ background:'rgba(0,229,255,0.12)', color:'#00e5ff', border:'1px solid rgba(0,229,255,0.2)', borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:600 }}>
          {total} lamaran
        </span>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <select style={{ background:'#10102a', color:'#c8d0ff', border:'1px solid rgba(0,229,255,0.14)', borderRadius:8, padding:'7px 12px', fontSize:13 }}
          value={filterPos} onChange={e => setFilterPos(e.target.value)}>
          <option value="">Semua Posisi</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select style={{ background:'#10102a', color:'#c8d0ff', border:'1px solid rgba(0,229,255,0.14)', borderRadius:8, padding:'7px 12px', fontSize:13 }}
          value={filterSt} onChange={e => setFilterSt(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600 }}
          onClick={load} disabled={loading}>
          {loading ? 'Memuat…' : '🔄 Refresh'}
        </button>
      </div>

      {/* List */}
      {apps.length === 0 && !loading && (
        <div style={{ textAlign:'center', color:'#6a7494', padding:48, fontSize:14 }}>Belum ada lamaran masuk.</div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {apps.map(app => (
          <div key={app._id} style={{ background:'#0a0a1f', border:'1px solid rgba(0,229,255,0.1)', borderRadius:12, overflow:'hidden' }}>
            {/* Header row */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontWeight:700, fontSize:14, color:'#c8d0ff' }}>{app.fullName}</span>
                  <span style={{ fontSize:11, color:'#6a7494' }}>@{app.username}</span>
                  <span style={{ background:'rgba(233,30,99,0.15)', color:'#e91e63', border:'1px solid rgba(233,30,99,0.25)', borderRadius:12, padding:'1px 8px', fontSize:11, fontWeight:600 }}>
                    {app.position}
                  </span>
                  <span style={{ background:`${STATUS_COLORS[app.status]}22`, color:STATUS_COLORS[app.status], border:`1px solid ${STATUS_COLORS[app.status]}44`, borderRadius:12, padding:'1px 8px', fontSize:11, fontWeight:600 }}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'#6a7494', marginTop:4, display:'flex', gap:12, flexWrap:'wrap' }}>
                  <span>{app.email}</span>
                  <span>Discord: {app.discord}</span>
                  <span>{new Date(app.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:6, flexShrink:0, flexWrap:'wrap' }}>
                <select
                  style={{ background:'#10102a', color:'#c8d0ff', border:'1px solid rgba(0,229,255,0.14)', borderRadius:7, padding:'4px 8px', fontSize:12 }}
                  value={app.status}
                  onChange={e => updateStatus(app._id, e.target.value)}
                >
                  {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button
                  style={{ background:'#1e293b', color:'#94a3b8', border:'1px solid rgba(0,229,255,0.1)', borderRadius:7, padding:'4px 10px', fontSize:12 }}
                  onClick={() => setExpanded(expanded === app._id ? null : app._id)}
                >
                  {expanded === app._id ? '▲ Tutup' : '▼ Detail'}
                </button>
                <button
                  style={{ background:'#7f1d1d', color:'#fca5a5', border:'none', borderRadius:7, padding:'4px 10px', fontSize:12 }}
                  onClick={() => deleteApp(app._id, app.fullName)}
                >
                  Hapus
                </button>
              </div>
            </div>

            {/* Expandable detail */}
            {expanded === app._id && (
              <div style={{ borderTop:'1px solid rgba(0,229,255,0.08)', padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'#6a7494', textTransform:'uppercase', letterSpacing:'0.05em' }}>Motivasi</p>
                  <p style={{ margin:0, fontSize:13, color:'#c8d0ff', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{app.motivation}</p>
                </div>
                <div>
                  <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'#6a7494', textTransform:'uppercase', letterSpacing:'0.05em' }}>Pengalaman</p>
                  <p style={{ margin:0, fontSize:13, color:'#c8d0ff', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{app.experience}</p>
                </div>
                {app.portfolio && (
                  <div>
                    <p style={{ margin:'0 0 4px', fontSize:11, fontWeight:700, color:'#6a7494', textTransform:'uppercase', letterSpacing:'0.05em' }}>Portofolio</p>
                    <a href={app.portfolio} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:13, color:'#00e5ff', wordBreak:'break-all' }}>{app.portfolio}</a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard shell
// ─────────────────────────────────────────────────────────────────────────────
type Section = 'news' | 'downloads' | 'redeem' | 'players' | 'requests' | 'logs' | 'career' | 'account';

function AdminDashboard({ onLogout, adminUser }: { onLogout: () => void; adminUser: AdminUser | null }) {
  const { articles, loading, refresh, create, update, remove, togglePublish } = useAdminNews();
  const [section, setSection]   = useState<Section>('news');
  const [view, setView]         = useState<'list' | 'new' | 'edit'>('list');
  const [editing, setEditing]   = useState<AdminNewsArticle | null>(null);
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
    if (view === 'edit' && editing) {
      await update(editing._id, data, asDraft);
      showToast('Artikel berhasil diperbarui.');
    } else {
      await create(data, asDraft);
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

  const goSection = (s: Section) => { setSection(s); setView('list'); setEditing(null); };

  return (
    <div className="admin-layout">
      {/* sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/Image/logo-taleshero.png" alt="Tales Hero" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span>Admin Panel</span>
        </div>

        {/* logged-in user info */}
        {adminUser && (
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__user-name">{adminUser.nickname || adminUser.username}</div>
            <div className="admin-sidebar__user-meta">
              <span className="admin-sidebar__user-id">@{adminUser.username}</span>
              <span
                className="admin-sidebar__role-badge"
                style={{ background: ROLE_COLORS[adminUser.role] ?? '#64748b' }}
              >
                {adminUser.role}
              </span>
            </div>
          </div>
        )}

        <nav className="admin-sidebar__nav">
          <button className={`admin-nav-link${section === 'news' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('news')}>
            <IconNews /> Berita
          </button>
          <button className={`admin-nav-link${section === 'downloads' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('downloads')}>
            <IconDownload /> Download
          </button>
          <button className={`admin-nav-link${section === 'redeem' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('redeem')}>
            <IconRedeem /> Redeem Code
          </button>
          <div className="admin-sidebar__nav-divider" />
          <button className={`admin-nav-link${section === 'players' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('players')}>
            <IconPlayers /> GM — Player
          </button>
          <button className={`admin-nav-link${section === 'requests' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('requests')}>
            <IconRequests /> GM — Requests
          </button>
          <button className={`admin-nav-link${section === 'logs' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('logs')}>
            <IconLog /> GM — Logs
          </button>
          <div className="admin-sidebar__nav-divider" />
          <button className={`admin-nav-link${section === 'career' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('career')}>
            <IconCareer /> Lamaran Karir
          </button>
          <div className="admin-sidebar__nav-divider" />
          <button className={`admin-nav-link${section === 'account' ? ' admin-nav-link--active' : ''}`}
            onClick={() => goSection('account')}>
            <IconAccount /> Akun Saya
          </button>
        </nav>
        <div className="admin-sidebar__footer">
          <button className="admin-nav-link" onClick={onLogout}><IconLogout /> Keluar</button>
        </div>
      </aside>

      {/* main area */}
      <main className="admin-main">
        {section === 'news' && view === 'list' && (
          <ArticleList
            articles={articles} loading={loading}
            onNew={() => { setEditing(null); setView('new'); }}
            onEdit={a => { setEditing(a); setView('edit'); }}
            onDelete={a => setDeleting(a)}
            onTogglePublish={handleToggle}
            onRefresh={refresh}
          />
        )}
        {section === 'news' && (view === 'new' || view === 'edit') && (
          <ArticleEditor
            initial={view === 'edit' ? editing : null}
            onSave={handleSave}
            onCancel={() => { setView('list'); setEditing(null); }}
          />
        )}
        {section === 'downloads' && (
          <DownloadManager showToast={showToast} />
        )}
        {section === 'redeem' && (
          <RedeemManager adminUser={adminUser} showToast={showToast} />
        )}
        {section === 'players'  && <GmPlayerSection  adminUser={adminUser} showToast={showToast} />}
        {section === 'requests' && <GmRequestsSection adminUser={adminUser} showToast={showToast} />}
        {section === 'logs'     && <GmLogsSection     adminUser={adminUser} />}
        {section === 'career'   && <CareerSection showToast={showToast} />}
        {section === 'account'  && <AccountSection    adminUser={adminUser} showToast={showToast} />}
      </main>

      {/* delete modal */}
      {deleting && (
        <DeleteModal title={deleting.title} onConfirm={handleDelete}
          onCancel={() => setDeleting(null)} loading={deleteLoading} />
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
  const { authenticated, adminUser, login, logout } = useAdminAuth();
  const { pauseMusic } = useMusic();

  // Pause BGM whenever the admin page is open
  useEffect(() => { pauseMusic(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (authenticated === null) {
    return (
      <div className="admin-loading" style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Poppins,sans-serif' }}>
        Memuat…
      </div>
    );
  }

  if (!authenticated) return <AdminLogin onLogin={login} />;

  return <AdminDashboard onLogout={logout} adminUser={adminUser} />;
}
