import { useState, useRef, useEffect, useCallback } from 'react';
import '@/Style/admin.scss';
import { renderMarkdown } from '@/Lib/markdown';
import { useAdminAuth, useAdminNews, type AdminNewsArticle, type NewsFormData, type AdminUser } from '@/Hooks/use-admin-news';
import { useAdminDownloads, type DownloadPackage } from '@/Hooks/use-downloads';
import { useAdminRedeem, searchItems, type RedeemCode, type RedeemFormData, type ItemResult } from '@/Hooks/use-admin-redeem';
import { useMusic } from '@/Hooks/use-music';

// ── category helpers ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  update: 'Update',
  info: 'Info',
  maintenance: 'Maintenance',
};

// ── icons (inline SVG to avoid dep) ─────────────────────────────────────────
const IconNews      = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconDownload  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconLogout    = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconPlus      = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconRefresh   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IconRedeem    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;

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
  code: '', cash_amount: 0, tr_amount: 0,
  item_num: 0, item_name: '', delivery_target: 'Giftbox',
  note: '', expires_days: 7,
});

function RedeemCreateForm({ onSave, onCancel }: {
  onSave: (data: RedeemFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RedeemFormData>(emptyRedeemForm);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [itemQuery, setItemQuery] = useState('');
  const [itemResults, setItemResults] = useState<ItemResult[]>([]);
  const [itemSearching, setItemSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof RedeemFormData>(k: K, v: RedeemFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleItemSearch = (q: string) => {
    setItemQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setItemResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setItemSearching(true);
      try { setItemResults(await searchItems(q)); }
      finally { setItemSearching(false); }
    }, 300);
  };

  const pickItem = (item: ItemResult) => {
    set('item_num', item.fdItemNum);
    set('item_name', item.fdItemName);
    setItemQuery(item.fdItemName);
    setItemResults([]);
  };

  const clearItem = () => {
    set('item_num', 0); set('item_name', '');
    setItemQuery(''); setItemResults([]);
  };

  const save = async () => {
    if (form.cash_amount <= 0 && form.tr_amount <= 0 && form.item_num <= 0) {
      setError('Isi minimal satu reward: Cash, TR, atau Item.'); return;
    }
    setSaving(true); setError('');
    try { await onSave(form); }
    catch (e: any) { setError(e.message ?? 'Gagal membuat kode'); setSaving(false); }
  };

  return (
    <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:12, padding:'24px 28px', marginBottom:24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ margin:0, fontSize:'0.95rem', fontWeight:700, color:'#0f172a' }}>Buat Kode Redeem Baru</h3>
        <button className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={saving}>Batal</button>
      </div>

      {error && <div className="admin-error" style={{ marginBottom:14 }}>{error}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 20px' }}>
        <div className="admin-form-field" style={{ gridColumn:'1/-1' }}>
          <label>Kode <span style={{ color:'#94a3b8', fontWeight:400, fontSize:12 }}>(kosongkan untuk generate otomatis)</span></label>
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

        <div className="admin-form-field" style={{ gridColumn:'1/-1', position:'relative' }}>
          <label>Item <span style={{ color:'#94a3b8', fontWeight:400, fontSize:12 }}>(cari nama atau nomor item)</span></label>
          {form.item_num > 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:8 }}>
              <span style={{ fontSize:13, color:'#1e40af', fontWeight:600 }}>#{form.item_num}</span>
              <span style={{ fontSize:13, color:'#1e40af', flex:1 }}>{form.item_name}</span>
              <button type="button" onClick={clearItem}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:16, lineHeight:1, padding:'0 2px' }}>×</button>
            </div>
          ) : (
            <>
              <input value={itemQuery} onChange={e => handleItemSearch(e.target.value)}
                placeholder="Ketik nama atau nomor item…" />
              {(itemSearching || itemResults.length > 0) && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:8, boxShadow:'0 4px 16px rgba(0,0,0,.1)', zIndex:50, maxHeight:200, overflowY:'auto' }}>
                  {itemSearching && <div style={{ padding:'10px 14px', fontSize:13, color:'#64748b' }}>Mencari…</div>}
                  {!itemSearching && itemResults.length === 0 && itemQuery.trim().length >= 2 && (
                    <div style={{ padding:'10px 14px', fontSize:13, color:'#64748b' }}>Item tidak ditemukan</div>
                  )}
                  {itemResults.map(it => (
                    <button key={it.fdItemNum} type="button" onClick={() => pickItem(it)}
                      style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 14px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#0f172a' }}
                      onMouseOver={e => (e.currentTarget.style.background='#f1f5f9')}
                      onMouseOut={e => (e.currentTarget.style.background='none')}>
                      <span style={{ color:'#94a3b8', marginRight:8, fontFamily:'monospace' }}>#{it.fdItemNum}</span>
                      {it.fdItemName}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {form.item_num > 0 && (
          <div className="admin-form-field">
            <label>Kirim ke</label>
            <select value={form.delivery_target} onChange={e => set('delivery_target', e.target.value as 'Giftbox' | 'Warehouse')}>
              <option value="Giftbox">Giftbox</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </div>
        )}

        <div className="admin-form-field" style={form.item_num > 0 ? {} : { gridColumn:'1/-1' }}>
          <label>Berlaku (hari)</label>
          <input type="number" min={1} max={365} value={form.expires_days}
            onChange={e => set('expires_days', Math.max(1, Number(e.target.value)))} />
        </div>

        <div className="admin-form-field" style={{ gridColumn:'1/-1' }}>
          <label>Catatan internal <span style={{ color:'#94a3b8', fontWeight:400, fontSize:12 }}>(opsional)</span></label>
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
                        {c.fdRewardItemNum && (
                          <div title={`#${c.fdRewardItemNum}`}>
                            🎁 {c.fdRewardItemName ?? `Item #${c.fdRewardItemNum}`}
                            {c.fdDeliveryTarget && <span style={{ color:'#94a3b8', marginLeft:4 }}>({c.fdDeliveryTarget})</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize:13, textAlign:'center', fontWeight:600, color: c.fdClaimCount > 0 ? '#0f172a' : '#cbd5e1' }}>
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
// Dashboard shell
// ─────────────────────────────────────────────────────────────────────────────
type Section = 'news' | 'downloads' | 'redeem';

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
