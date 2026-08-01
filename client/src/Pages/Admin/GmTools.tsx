// ============================================================
//  Tales Hero Indonesia — GM Tools UI
//  Semua fitur dari PHP admin tool teman diintegrasikan ke sini.
//  Komponen yang diekspor:
//    GmStatsBar        — baris statistik server
//    GmPlayerSection   — cari player, kirim cash/TR/item, ban, role, inventory
//    GmRequestsSection — antrian request GM → Owner
//    GmLogsSection     — log aktivitas admin
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AdminUser } from '@/Hooks/use-admin-news';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GmPlayer {
  fdUserNum:      number;
  UserId:         string;
  fdNickname:     string;
  RoleName:       string;
  Cash:           number;
  GameMoney:      number;
  Mau:            number;
  Exp:            number;
  Attribute:      number;   // 1 = Piero/GM character
  IsBanned:       number;
  fdLastLoginTime?: string | null;
  fdLoginCount?:  number;
}

export interface GmInventoryItem {
  fdNum:             number;
  fdItemDescNum:     number;
  ItemName:          string;
  fdExp:             number;
  fdExpireDateTime:  string | null;
  fdCount:           number;
  fdUsing:           number;
  fdGotDateTime?:    string;
}

export interface GmRequest {
  fdRequestId:            number;
  fdType:                 string;
  fdRequestedByUserId:    string;
  fdRequestedByNickname:  string;
  fdTargetUserNum:        number;
  fdTargetUserId:         string;
  fdTargetNickname:       string;
  fdAmount:               number;
  fdItemNum:              number | null;
  fdItemName:             string | null;
  fdDeliveryTarget:       string;
  fdStatus:               string;
  fdNote:                 string;
  fdRequestedAt:          string;
  fdReviewedAt:           string | null;
}

export interface GmLog {
  fdLogId:         number;
  fdActionType:    string;
  fdActorUserId:   string;
  fdActorNickname: string;
  fdTargetInfo:    string;
  fdDetail:        string;
  fdLoggedAt:      string;
}

export interface GmItem {
  fdItemNum:  number;
  fdItemName: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function gmFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`/api/admin/gm${path}`, {
    credentials: 'include',
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.message ?? `HTTP ${r.status}`);
  return body;
}

// ── Piero colours ─────────────────────────────────────────────────────────────

const PIERO_COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Navy', 'Purple', 'Angel', 'Devil', 'Winter', 'Black'];

const PIERO_SWATCH: Record<string, string> = {
  Red:    '#ef4444', Orange: '#f97316', Yellow: '#eab308', Green:  '#22c55e',
  Blue:   '#3b82f6', Navy:   '#1e3a8a', Purple: '#a855f7', Angel:  '#e0f2fe',
  Devil:  '#7f1d1d', Winter: '#bae6fd', Black:  '#1e293b',
};

// ── Role colour ───────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  Owner: '#f59e0b',
  Staff: '#6366f1',
  GM:    '#10b981',
  Player:'#64748b',
};

// ── Inline sub-styles (complements admin.scss) ─────────────────────────────────

const S = {
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
  } as React.CSSProperties,
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 4, flex: 1, minWidth: 160 },
  label: { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 2 },
  input: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
    fontSize: 13.5, fontFamily: 'Poppins, sans-serif', background: '#fff',
    outline: 'none', width: '100%', boxSizing: 'border-box' as const,
  } as React.CSSProperties,
  btn: {
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 13,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 14, marginBottom: 24,
  },
  statCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
    padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 4,
  },
};

// ── GmStatsBar ────────────────────────────────────────────────────────────────

interface GmStats {
  totalPlayers:    number;
  onlinePlayers:   number;
  totalCash:       number;
  totalTR:         number;
  pendingRequests: number;
}

export function GmStatsBar() {
  const [stats, setStats] = useState<GmStats | null>(null);

  useEffect(() => {
    gmFetch('/stats').then(setStats).catch(() => null);
  }, []);

  if (!stats) return null;

  const items = [
    { label: 'Total Player', value: stats.totalPlayers.toLocaleString('id-ID'), color: '#6366f1' },
    { label: 'Online',       value: stats.onlinePlayers.toLocaleString('id-ID'), color: '#10b981' },
    { label: 'Total Cash',   value: stats.totalCash.toLocaleString('id-ID'),    color: '#f59e0b' },
    { label: 'Total TR',     value: stats.totalTR.toLocaleString('id-ID'),      color: '#3b82f6' },
    { label: 'Request Pending', value: stats.pendingRequests.toLocaleString('id-ID'),
      color: stats.pendingRequests > 0 ? '#ef4444' : '#64748b' },
  ];

  return (
    <div style={S.statsGrid}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={S.statCard}>
          <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
          <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── GmPlayerSection ───────────────────────────────────────────────────────────

type PlayerTab = 'send' | 'inventory' | 'manage';

export function GmPlayerSection({ adminUser, showToast }: {
  adminUser: AdminUser | null;
  showToast: (msg: string) => void;
}) {
  const isOwner = adminUser?.role === 'Owner';

  // search
  const [q, setQ]               = useState('');
  const [results, setResults]   = useState<GmPlayer[]>([]);
  const [searching, setSearching] = useState(false);

  // selected player
  const [player, setPlayer]     = useState<GmPlayer | null>(null);
  const [playerTab, setPlayerTab] = useState<PlayerTab>('send');

  // send cash / TR / MAU / EXP
  const [cashAmt, setCashAmt]   = useState('');
  const [trAmt, setTrAmt]       = useState('');
  const [mauAmt, setMauAmt]       = useState('');
  const [expAmt, setExpAmt]       = useState('');
  const [pieroColor, setPieroColorVal] = useState<string>('');

  // send item
  const [itemQ, setItemQ]       = useState('');
  const [itemResults, setItemResults] = useState<GmItem[]>([]);
  const [selItem, setSelItem]   = useState<GmItem | null>(null);
  const [delivery, setDelivery] = useState<'Giftbox' | 'Warehouse'>('Giftbox');

  // inventory
  const [invQ, setInvQ]         = useState('');
  const [inventory, setInventory] = useState<GmInventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [extendTarget, setExtendTarget] = useState<{ invNum: number; name: string } | null>(null);
  const [extendExp, setExtendExp] = useState('');

  // manage (Owner only)
  const [banReason, setBanReason] = useState('');
  const [newRole, setNewRole]   = useState('');
  const [newNick, setNewNick]   = useState('');
  const [newPw, setNewPw]       = useState('');

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const act = async (fn: () => Promise<unknown>) => {
    setLoading(true); setError('');
    try {
      const r: any = await fn();
      showToast(r?.message ?? 'Berhasil.');
      return true;
    } catch (e: any) {
      setError(e.message ?? 'Terjadi kesalahan.');
      return false;
    } finally { setLoading(false); }
  };

  // search players
  const search = async () => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const rows = await gmFetch(`/players?q=${encodeURIComponent(q)}`);
      setResults(rows);
      if (!rows.length) setError('Tidak ada player ditemukan.');
    } catch (e: any) { setError(e.message); }
    finally { setSearching(false); }
  };

  // select player → refresh detail
  const selectPlayer = async (p: GmPlayer) => {
    setError('');
    setPlayer(p);
    setPlayerTab('send');
    setCashAmt(''); setTrAmt('');
    setSelItem(null); setItemQ(''); setItemResults([]);
    setBanReason(''); setNewRole(p.RoleName); setNewNick(p.fdNickname); setNewPw('');
    setInventory([]);
  };

  const refreshPlayer = async () => {
    if (!player) return;
    try {
      const p = await gmFetch(`/players/${player.fdUserNum}`);
      setPlayer(p);
    } catch { /* ignore */ }
  };

  // search items
  const searchItems = async () => {
    if (!itemQ.trim()) return;
    try {
      const rows = await gmFetch(`/items?q=${encodeURIComponent(itemQ)}`);
      setItemResults(rows);
    } catch (e: any) { setError(e.message); }
  };

  // load inventory
  const loadInventory = async () => {
    if (!player) return;
    setInvLoading(true);
    try {
      const path = invQ.trim()
        ? `/players/${player.fdUserNum}/inventory?q=${encodeURIComponent(invQ)}`
        : `/players/${player.fdUserNum}/inventory`;
      const rows = await gmFetch(path);
      setInventory(rows);
    } catch (e: any) { setError(e.message); }
    finally { setInvLoading(false); }
  };

  useEffect(() => {
    if (playerTab === 'inventory' && player) loadInventory();
  }, [playerTab, player?.fdUserNum]); // eslint-disable-line

  // ── Send actions ────────────────────────────────────────────
  const doSendCash = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/cash`, {
      method: 'POST', body: JSON.stringify({ amount: Number(cashAmt) }),
    });
    setCashAmt(''); await refreshPlayer(); return r;
  });

  const doSendMau = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/mau`, {
      method: 'POST', body: JSON.stringify({ amount: Number(mauAmt) }),
    });
    setMauAmt(''); return r;
  });

  const doSendExp = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/exp`, {
      method: 'POST', body: JSON.stringify({ amount: Number(expAmt) }),
    });
    setExpAmt(''); return r;
  });

  const doSendTR = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/tr`, {
      method: 'POST', body: JSON.stringify({ amount: Number(trAmt) }),
    });
    setTrAmt(''); await refreshPlayer(); return r;
  });

  const doSendItem = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/item`, {
      method: 'POST', body: JSON.stringify({ itemNum: selItem!.fdItemNum, delivery }),
    });
    setSelItem(null); setItemQ(''); setItemResults([]); return r;
  });

  // ── Manage actions ──────────────────────────────────────────
  const doBan = (ban: boolean) => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/ban`, {
      method: 'PATCH', body: JSON.stringify({ ban, reason: banReason }),
    });
    setBanReason(''); await refreshPlayer(); return r;
  });

  const doSetRole = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/role`, {
      method: 'PATCH', body: JSON.stringify({ role: newRole }),
    });
    await refreshPlayer(); return r;
  });

  const doSetNickname = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/nickname`, {
      method: 'PATCH', body: JSON.stringify({ nickname: newNick }),
    });
    await refreshPlayer(); return r;
  });

  const doSetPassword = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/password`, {
      method: 'PATCH', body: JSON.stringify({ newPassword: newPw }),
    });
    setNewPw(''); return r;
  });

  const doSetPiero = (isPiero: boolean) => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/piero`, {
      method: 'PATCH', body: JSON.stringify({ isPiero }),
    });
    await refreshPlayer(); return r;
  });

  const doSetPieroColor = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/piero-color`, {
      method: 'PATCH', body: JSON.stringify({ color: pieroColor }),
    });
    setPieroColorVal(''); return r;
  });

  // ── Inventory actions ───────────────────────────────────────
  const doDeleteInv = (invNum: number) => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/inventory/${invNum}`, { method: 'DELETE' });
    await loadInventory(); return r;
  });

  const doExtendExp = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/inventory/${extendTarget!.invNum}/extend`, {
      method: 'PATCH', body: JSON.stringify({ expAmount: Number(extendExp) }),
    });
    setExtendTarget(null); setExtendExp(''); await loadInventory(); return r;
  });

  // ── Render ────────────────────────────────────────────────────
  const tabBtn = (tab: PlayerTab, label: string) => (
    <button
      onClick={() => setPlayerTab(tab)}
      style={{
        ...S.btn,
        background: playerTab === tab ? '#6366f1' : '#f1f5f9',
        color:      playerTab === tab ? '#fff' : '#374151',
        fontSize: 12,
      }}
    >{label}</button>
  );

  return (
    <div>
      <div className="admin-topbar"><h1>Player Manager</h1></div>
      <div className="admin-content">
        {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Stats */}
        <GmStatsBar />

        {/* Search */}
        <div style={S.card}>
          <div style={{ ...S.row, alignItems: 'flex-end' }}>
            <div style={{ ...S.field, minWidth: 220 }}>
              <label style={S.label}>Cari Player</label>
              <input
                style={S.input}
                placeholder="Nickname / UserNum / UserID"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
            </div>
            <button
              style={{ ...S.btn, background: '#6366f1', color: '#fff', whiteSpace: 'nowrap' }}
              onClick={search}
              disabled={searching}
            >
              {searching ? 'Mencari…' : '🔍 Cari'}
            </button>
          </div>
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13.5 }}>
              Hasil Pencarian ({results.length})
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>UserNum</th><th>Nickname</th><th>Role</th>
                    <th>Cash</th><th>TR</th><th>MAU</th><th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(p => (
                    <tr key={p.fdUserNum} style={{ background: player?.fdUserNum === p.fdUserNum ? '#f0f9ff' : undefined }}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.fdUserNum}</td>
                      <td style={{ fontWeight: 600 }}>{p.fdNickname}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: ROLE_COLOR[p.RoleName] ?? '#64748b', color: '#fff' }}>
                          {p.RoleName}
                        </span>
                      </td>
                      <td>{Number(p.Cash).toLocaleString('id-ID')}</td>
                      <td>{Number(p.GameMoney).toLocaleString('id-ID')}</td>
                      <td>{Number(p.Mau).toLocaleString('id-ID')}</td>
                      <td>
                        {p.IsBanned
                          ? <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>🔴 Banned</span>
                          : <span style={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>🟢 Normal</span>}
                      </td>
                      <td>
                        <button
                          style={{ ...S.btn, background: '#6366f1', color: '#fff', padding: '5px 14px', fontSize: 12 }}
                          onClick={() => selectPlayer(p)}
                        >
                          Pilih
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected player panel */}
        {player && (
          <div style={S.card}>
            {/* Player info header */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ flex: 2, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Player Aktif
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                  {player.fdNickname}
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: ROLE_COLOR[player.RoleName] ?? '#64748b', color: '#fff', verticalAlign: 'middle' }}>
                    {player.RoleName}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  UserNum: <b>{player.fdUserNum}</b> · ID: <b>{player.UserId || '–'}</b>
                  {player.IsBanned ? <span style={{ marginLeft: 8, color: '#ef4444', fontWeight: 700 }}>🔴 BANNED</span>
                    : <span style={{ marginLeft: 8, color: '#10b981', fontWeight: 600 }}>🟢 Normal</span>}
                  {player.Attribute === 1 && (
                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: '#0ea5e9', color: '#fff' }}>⭐ Piero</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>CASH</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>
                    {Number(player.Cash).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>TR</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#3b82f6' }}>
                    {Number(player.GameMoney).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>MAU</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>
                    {Number(player.Mau).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>EXP</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                    {Number(player.Exp).toLocaleString('id-ID')}
                  </div>
                </div>
                {player.fdLoginCount !== undefined && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>LOGIN</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#64748b' }}>
                      {player.fdLoginCount?.toLocaleString('id-ID')}x
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {tabBtn('send',      '📦 Kirim')}
              {tabBtn('inventory', '🎒 Inventory')}
              {isOwner && tabBtn('manage', '⚙️ Kelola')}
            </div>

            {/* === Tab: Kirim === */}
            {playerTab === 'send' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* ── Baris 1: Currency (Cash / TR / MAU) ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  {/* Cash */}
                  <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#92400e' }}>💰 Cash</div>
                    <input style={S.input} type="number" min="1" placeholder="Jumlah"
                      value={cashAmt} onChange={e => setCashAmt(e.target.value)} />
                    <button
                      style={{ ...S.btn, background: '#f59e0b', color: '#fff', marginTop: 8, width: '100%', justifyContent: 'center', fontSize: 12 }}
                      onClick={doSendCash} disabled={loading || !cashAmt}
                    >
                      {isOwner ? '✓ Kirim' : '📨 Request'}
                    </button>
                  </div>

                  {/* TR */}
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#1e40af' }}>⚔️ TR</div>
                    <input style={S.input} type="number" min="1" placeholder="Jumlah"
                      value={trAmt} onChange={e => setTrAmt(e.target.value)} />
                    <button
                      style={{ ...S.btn, background: '#3b82f6', color: '#fff', marginTop: 8, width: '100%', justifyContent: 'center', fontSize: 12 }}
                      onClick={doSendTR} disabled={loading || !trAmt}
                    >
                      {isOwner ? '✓ Kirim' : '📨 Request'}
                    </button>
                  </div>

                  {/* MAU */}
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#5b21b6' }}>✨ MAU</div>
                    <input style={S.input} type="number" min="1" placeholder="Jumlah"
                      value={mauAmt} onChange={e => setMauAmt(e.target.value)} />
                    <button
                      style={{ ...S.btn, background: '#7c3aed', color: '#fff', marginTop: 8, width: '100%', justifyContent: 'center', fontSize: 12 }}
                      onClick={doSendMau} disabled={loading || !mauAmt}
                    >
                      {isOwner ? '✓ Kirim' : '📨 Request'}
                    </button>
                  </div>
                </div>

                {/* ── Baris 2: EXP Player (Owner only) ── */}
                {isOwner && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#065f46' }}>🌟 EXP Player <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280' }}>(Owner only — langsung diterapkan)</span></div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input style={{ ...S.input, flex: 1 }} type="number" min="1" placeholder="Jumlah EXP"
                        value={expAmt} onChange={e => setExpAmt(e.target.value)} />
                      <button
                        style={{ ...S.btn, background: '#10b981', color: '#fff', whiteSpace: 'nowrap', fontSize: 12 }}
                        onClick={doSendExp} disabled={loading || !expAmt}
                      >
                        ✓ Tambah EXP
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Baris 3: Item ── */}
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#9a3412' }}>🎁 Kirim Item</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input style={{ ...S.input, flex: 1 }} placeholder="Cari nama atau #kode item"
                      value={itemQ} onChange={e => setItemQ(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchItems()} />
                    <button style={{ ...S.btn, background: '#f97316', color: '#fff', padding: '8px 12px', fontSize: 12 }}
                      onClick={searchItems}>🔍 Cari</button>
                  </div>
                  {itemResults.length > 0 && (
                    <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #fed7aa', borderRadius: 6, marginBottom: 8 }}>
                      {itemResults.map(item => (
                        <div key={item.fdItemNum}
                          onClick={() => { setSelItem(item); setItemResults([]); setItemQ(item.fdItemName); }}
                          style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12,
                            background: selItem?.fdItemNum === item.fdItemNum ? '#ffedd5' : '#fff',
                            borderBottom: '1px solid #fff7ed',
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', color: '#94a3b8', marginRight: 6 }}>#{item.fdItemNum}</span>
                          {item.fdItemName}
                        </div>
                      ))}
                    </div>
                  )}
                  {selItem && (
                    <div style={{ marginBottom: 8, padding: '6px 12px', background: '#ffedd5', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                      <span><b>#{selItem.fdItemNum}</b> {selItem.fdItemName}</span>
                      <button type="button" onClick={() => { setSelItem(null); setItemQ(''); }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1 }}>×</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {(['Giftbox', 'Warehouse'] as const).map(d => (
                      <button key={d} onClick={() => setDelivery(d)}
                        style={{ ...S.btn, flex: 1, justifyContent: 'center', fontSize: 12,
                          background: delivery === d ? '#f97316' : '#f1f5f9',
                          color: delivery === d ? '#fff' : '#374151' }}
                      >{d}</button>
                    ))}
                  </div>
                  <button
                    style={{ ...S.btn, background: '#f97316', color: '#fff', width: '100%', justifyContent: 'center', fontSize: 12 }}
                    onClick={doSendItem} disabled={loading || !selItem}
                  >
                    {isOwner ? `✓ Kirim ke ${delivery}` : '📨 Request Item'}
                  </button>
                </div>

              </div>
            )}

            {/* === Tab: Inventory === */}
            {playerTab === 'inventory' && (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input style={{ ...S.input, maxWidth: 240 }} placeholder="Filter nama / kode item"
                    value={invQ} onChange={e => setInvQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadInventory()} />
                  <button style={{ ...S.btn, background: '#6366f1', color: '#fff' }}
                    onClick={loadInventory} disabled={invLoading}>
                    {invLoading ? 'Loading…' : '🔄 Refresh'}
                  </button>
                </div>

                {/* Extend Exp modal */}
                {extendTarget && (
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                      Tambah Exp — {extendTarget.name}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input style={{ ...S.input, maxWidth: 180 }} type="number" min="1" max="1000000000"
                        placeholder="Jumlah exp" value={extendExp} onChange={e => setExtendExp(e.target.value)} />
                      <button style={{ ...S.btn, background: '#3b82f6', color: '#fff' }}
                        onClick={doExtendExp} disabled={loading || !extendExp}>
                        {isOwner ? 'Tambah' : 'Request'}
                      </button>
                      <button style={{ ...S.btn, background: '#f1f5f9', color: '#374151' }}
                        onClick={() => { setExtendTarget(null); setExtendExp(''); }}>
                        Batal
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                      Exp akan ditambah dan masa berlaku item diset permanen (2099).
                    </div>
                  </div>
                )}

                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Item</th><th>Exp</th><th>Berlaku</th><th>Count</th>
                        {(isOwner) && <th>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {invLoading && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>Memuat…</td></tr>
                      )}
                      {!invLoading && inventory.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>
                          Inventory kosong.
                        </td></tr>
                      )}
                      {inventory.map(item => {
                        const expired = item.fdExpireDateTime && new Date(item.fdExpireDateTime) < new Date();
                        return (
                          <tr key={item.fdNum}>
                            <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>{item.fdNum}</td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.ItemName}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>#{item.fdItemDescNum}</div>
                            </td>
                            <td style={{ fontSize: 12 }}>{item.fdExp.toLocaleString('id-ID')}</td>
                            <td style={{ fontSize: 12, color: expired ? '#ef4444' : '#64748b' }}>
                              {item.fdExpireDateTime
                                ? new Date(item.fdExpireDateTime).toLocaleDateString('id-ID')
                                : '∞ Permanen'}
                              {expired && <div style={{ fontSize: 10, color: '#ef4444' }}>Kedaluwarsa</div>}
                            </td>
                            <td style={{ fontSize: 12 }}>{item.fdCount}</td>
                            {(isOwner) && (
                              <td>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    style={{ ...S.btn, background: '#3b82f6', color: '#fff', padding: '4px 10px', fontSize: 11 }}
                                    onClick={() => { setExtendTarget({ invNum: item.fdNum, name: item.ItemName }); setExtendExp(''); }}
                                    disabled={loading}
                                  >+Exp</button>
                                  <button
                                    style={{ ...S.btn, background: '#ef4444', color: '#fff', padding: '4px 10px', fontSize: 11 }}
                                    onClick={() => { if (confirm(`Hapus ${item.ItemName}?`)) doDeleteInv(item.fdNum); }}
                                    disabled={loading}
                                  >Hapus</button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!isOwner && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                    GM: hapus dan extend exp akan membuat request ke Owner.
                  </div>
                )}
              </div>
            )}

            {/* === Tab: Kelola (Owner only) === */}
            {playerTab === 'manage' && isOwner && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {/* Ban / Unban */}
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5 }}>
                    {player.IsBanned ? '🔓 Unban Player' : '🔨 Ban Player'}
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Alasan</label>
                    <input style={S.input} placeholder="Alasan ban/unban"
                      value={banReason} onChange={e => setBanReason(e.target.value)} />
                  </div>
                  {player.IsBanned
                    ? <button style={{ ...S.btn, background: '#10b981', color: '#fff', marginTop: 10, width: '100%', justifyContent: 'center' }}
                        onClick={() => doBan(false)} disabled={loading}>🔓 Unban</button>
                    : <button style={{ ...S.btn, background: '#ef4444', color: '#fff', marginTop: 10, width: '100%', justifyContent: 'center' }}
                        onClick={() => { if (confirm('Ban player ini?')) doBan(true); }} disabled={loading}>🔨 Ban</button>
                  }
                </div>

                {/* Change Role */}
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5 }}>🏷️ Ubah Role</div>
                  <div style={S.field}>
                    <label style={S.label}>Role Baru</label>
                    <select style={{ ...S.input, cursor: 'pointer' }} value={newRole} onChange={e => setNewRole(e.target.value)}>
                      <option value="Player">Player</option>
                      <option value="GM">GM</option>
                      <option value="Staff">Staff</option>
                      <option value="Owner">Owner</option>
                    </select>
                  </div>
                  <button style={{ ...S.btn, background: '#7c3aed', color: '#fff', marginTop: 10, width: '100%', justifyContent: 'center' }}
                    onClick={doSetRole} disabled={loading || newRole === player.RoleName}>
                    ✓ Simpan Role
                  </button>
                </div>

                {/* Change Nickname */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5 }}>✏️ Ubah Nickname</div>
                  <div style={S.field}>
                    <label style={S.label}>Nickname Baru</label>
                    <input style={S.input} placeholder="Nickname baru"
                      value={newNick} onChange={e => setNewNick(e.target.value)} />
                  </div>
                  <button style={{ ...S.btn, background: '#10b981', color: '#fff', marginTop: 10, width: '100%', justifyContent: 'center' }}
                    onClick={doSetNickname} disabled={loading || !newNick.trim()}>
                    ✓ Simpan Nickname
                  </button>
                </div>

                {/* Change Password */}
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5 }}>🔑 Reset Password</div>
                  <div style={S.field}>
                    <label style={S.label}>Password Baru (min 6 karakter)</label>
                    <input style={S.input} type="password" placeholder="Password baru"
                      value={newPw} onChange={e => setNewPw(e.target.value)} />
                  </div>
                  <button style={{ ...S.btn, background: '#f59e0b', color: '#fff', marginTop: 10, width: '100%', justifyContent: 'center' }}
                    onClick={() => { if (confirm('Reset password player ini?')) doSetPassword(); }}
                    disabled={loading || newPw.length < 6}>
                    ✓ Reset Password
                  </button>
                </div>

                {/* Piero Account */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5 }}>
                    ⭐ Piero Account
                    {player.Attribute === 1 && (
                      <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: 11,
                        background: '#0ea5e9', color: '#fff' }}>AKTIF</span>
                    )}
                  </div>
                  {player.Attribute === 1 ? (
                    <button
                      style={{ ...S.btn, background: '#94a3b8', color: '#fff', marginBottom: 12, width: '100%', justifyContent: 'center' }}
                      onClick={() => { if (confirm('Nonaktifkan Piero untuk player ini?')) doSetPiero(false); }}
                      disabled={loading}
                    >
                      🔴 Nonaktifkan Piero
                    </button>
                  ) : (
                    <button
                      style={{ ...S.btn, background: '#0ea5e9', color: '#fff', marginBottom: 12, width: '100%', justifyContent: 'center' }}
                      onClick={() => { if (confirm('Aktifkan akun Piero untuk player ini?')) doSetPiero(true); }}
                      disabled={loading}
                    >
                      ⭐ Aktifkan Piero
                    </button>
                  )}
                  {player.Attribute === 1 && (
                    <div>
                      <label style={S.label}>Warna Piero</label>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <select
                          style={{ ...S.input, flex: 1, cursor: 'pointer' }}
                          value={pieroColor}
                          onChange={e => setPieroColorVal(e.target.value)}
                        >
                          <option value="">-- Pilih Warna --</option>
                          {PIERO_COLORS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <button
                          style={{ ...S.btn, background: '#0ea5e9', color: '#fff', whiteSpace: 'nowrap' }}
                          onClick={doSetPieroColor}
                          disabled={loading || !pieroColor}
                        >
                          ✓ Set Warna
                        </button>
                      </div>
                      {/* colour swatches */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {PIERO_COLORS.map(c => (
                          <button
                            key={c}
                            title={c}
                            onClick={() => setPieroColorVal(c)}
                            style={{
                              width: 22, height: 22, borderRadius: '50%', border: pieroColor === c ? '2px solid #0ea5e9' : '2px solid transparent',
                              background: PIERO_SWATCH[c], cursor: 'pointer', padding: 0, outline: 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GmRequestsSection ─────────────────────────────────────────────────────────

export function GmRequestsSection({ adminUser, showToast }: {
  adminUser: AdminUser | null;
  showToast: (msg: string) => void;
}) {
  const isOwner = adminUser?.role === 'Owner';
  const [requests, setRequests] = useState<GmRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [acting, setActing]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRequests(await gmFetch('/requests')); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doApprove = async (id: number) => {
    setActing(true);
    try {
      const r = await gmFetch(`/requests/${id}/approve`, { method: 'POST', body: '{}' });
      showToast(r.message ?? 'Request di-approve.');
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  };

  const doReject = async () => {
    if (!rejectId) return;
    setActing(true);
    try {
      const r = await gmFetch(`/requests/${rejectId}/reject`, {
        method: 'POST', body: JSON.stringify({ note: rejectNote }),
      });
      showToast(r.message ?? 'Request ditolak.');
      setRejectId(null); setRejectNote('');
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setActing(false); }
  };

  const statusColor: Record<string, string> = {
    Pending:  '#f59e0b',
    Approved: '#10b981',
    Rejected: '#ef4444',
  };
  const typeLabel: Record<string, string> = {
    Cash:            '💰 Cash',
    TR:              '⚔️ TR',
    Mau:             '✨ MAU',
    Item:            '🎁 Item',
    InventoryDelete: '🗑️ Hapus Inventory',
    InventoryExtend: '📈 Extend Exp',
  };

  const pending = requests.filter(r => r.fdStatus === 'Pending');
  const history = requests.filter(r => r.fdStatus !== 'Pending');

  return (
    <div>
      <div className="admin-topbar">
        <h1>GM Requests</h1>
        <div className="admin-topbar__actions">
          <button className="admin-btn admin-btn--ghost" onClick={load} disabled={loading}>🔄 Refresh</button>
        </div>
      </div>
      <div className="admin-content">
        {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Reject modal */}
        {rejectId && (
          <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Tolak Request #{rejectId}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="Alasan penolakan (opsional)"
                value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
              <button style={{ ...S.btn, background: '#ef4444', color: '#fff' }}
                onClick={doReject} disabled={acting}>Tolak</button>
              <button style={{ ...S.btn, background: '#f1f5f9', color: '#374151' }}
                onClick={() => { setRejectId(null); setRejectNote(''); }}>Batal</button>
            </div>
          </div>
        )}

        {/* Pending */}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '14px 20px', background: '#fff7ed', borderBottom: '1px solid #fed7aa', fontWeight: 700, fontSize: 13.5 }}>
            ⏳ Pending ({pending.length})
          </div>
          {loading
            ? <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Memuat…</div>
            : pending.length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Tidak ada request pending.</div>
            : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Tipe</th><th>Dari</th><th>Target</th><th>Detail</th><th>Waktu</th>
                      {isOwner && <th>Aksi</th>}</tr>
                  </thead>
                  <tbody>
                    {pending.map(r => (
                      <tr key={r.fdRequestId}>
                        <td><span style={{ fontWeight: 700, fontSize: 12 }}>{typeLabel[r.fdType] ?? r.fdType}</span></td>
                        <td style={{ fontSize: 12 }}>{r.fdRequestedByNickname}<br/><span style={{ color: '#94a3b8' }}>{r.fdRequestedByUserId}</span></td>
                        <td style={{ fontSize: 12 }}>{r.fdTargetNickname}</td>
                        <td style={{ fontSize: 12 }}>
                          {r.fdAmount > 0 && <div>{Number(r.fdAmount).toLocaleString('id-ID')}</div>}
                          {r.fdItemName && <div>🎁 {r.fdItemName} {r.fdDeliveryTarget && `(${r.fdDeliveryTarget})`}</div>}
                          {r.fdNote && <div style={{ color: '#94a3b8', fontSize: 11 }}>{r.fdNote.slice(0, 80)}</div>}
                        </td>
                        <td style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {new Date(r.fdRequestedAt).toLocaleString('id-ID')}
                        </td>
                        {isOwner && (
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button style={{ ...S.btn, background: '#10b981', color: '#fff', padding: '5px 12px', fontSize: 12 }}
                                onClick={() => doApprove(r.fdRequestId)} disabled={acting}>✓ Approve</button>
                              <button style={{ ...S.btn, background: '#ef4444', color: '#fff', padding: '5px 12px', fontSize: 12 }}
                                onClick={() => setRejectId(r.fdRequestId)} disabled={acting}>✕ Tolak</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 13.5 }}>
              📋 Riwayat ({history.length})
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr><th>Tipe</th><th>Dari</th><th>Target</th><th>Detail</th><th>Status</th><th>Waktu</th></tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.fdRequestId}>
                      <td style={{ fontWeight: 700, fontSize: 12 }}>{typeLabel[r.fdType] ?? r.fdType}</td>
                      <td style={{ fontSize: 12 }}>{r.fdRequestedByNickname}</td>
                      <td style={{ fontSize: 12 }}>{r.fdTargetNickname}</td>
                      <td style={{ fontSize: 12 }}>
                        {r.fdAmount > 0 && <span>{Number(r.fdAmount).toLocaleString('id-ID')} </span>}
                        {r.fdItemName && <span>🎁 {r.fdItemName}</span>}
                      </td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: statusColor[r.fdStatus] ?? '#64748b', color: '#fff' }}>
                          {r.fdStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {new Date(r.fdRequestedAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── GmLogsSection ─────────────────────────────────────────────────────────────

export function GmLogsSection({ adminUser }: { adminUser: AdminUser | null }) {
  const [logs, setLogs]       = useState<GmLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setLogs(await gmFetch('/logs')); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const actionColor: Record<string, string> = {
    SEND_CASH:         '#f59e0b',
    SEND_TR:           '#3b82f6',
    SEND_MAU:          '#7c3aed',
    SEND_EXP:          '#10b981',
    SEND_ITEM:         '#10b981',
    BAN_PLAYER:        '#ef4444',
    UNBAN_PLAYER:      '#10b981',
    UPDATE_ROLE:       '#7c3aed',
    CHANGE_NICKNAME:   '#6366f1',
    CHANGE_PASSWORD:   '#f97316',
    DELETE_INVENTORY:  '#dc2626',
    EXTEND_INVENTORY_EXP: '#3b82f6',
    APPROVE_REQUEST:   '#10b981',
    REJECT_REQUEST:    '#ef4444',
    SET_PIERO_ACCOUNT: '#0ea5e9',
    SET_PIERO_COLOR:   '#0284c7',
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1>Action Log</h1>
        <div className="admin-topbar__actions">
          <button className="admin-btn admin-btn--ghost" onClick={load} disabled={loading}>🔄 Refresh</button>
        </div>
      </div>
      <div className="admin-content">
        {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          {loading
            ? <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Memuat log…</div>
            : logs.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>Belum ada log aktivitas.</div>
            : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr><th>Aksi</th><th>Admin</th><th>Target</th><th>Detail</th><th>Waktu</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.fdLogId}>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                            background: actionColor[log.fdActionType] ?? '#64748b', color: '#fff',
                            whiteSpace: 'nowrap' }}>
                            {log.fdActionType}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {log.fdActorNickname}
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{log.fdActorUserId}</div>
                        </td>
                        <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{log.fdTargetInfo}</td>
                        <td style={{ fontSize: 12, color: '#64748b', maxWidth: 220, wordBreak: 'break-word' }}>
                          {log.fdDetail}
                        </td>
                        <td style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {new Date(log.fdLoggedAt).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
