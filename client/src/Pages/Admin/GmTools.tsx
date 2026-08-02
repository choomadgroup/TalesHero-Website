// ============================================================
//  Tales Hero Indonesia — GM Tools UI
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

// Valid colors from usp_GM_SetPieroColor (SP indices 0-6, 8, 9, 11, 12).
// Index 7 (Santa) and 10 (Police) are commented out in the SP → ret=1.
// Black is SP index 12 (PHP label was wrong with index 10).
const PIERO_COLORS = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Navy', 'Purple', 'Angel', 'Devil', 'Worker', 'Black'];

const PIERO_SWATCH: Record<string, string> = {
  Red:    '#ef4444', Orange: '#f97316', Yellow: '#eab308', Green:  '#22c55e',
  Blue:   '#3b82f6', Navy:   '#1e3a8a', Purple: '#a855f7',
  Angel:  '#bae6fd', Devil:  '#7f1d1d', Worker: '#a16207', Black:  '#1e293b',
};

// ── Role colour ───────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  Owner: '#f59e0b',
  Staff: '#6366f1',
  GM:    '#10b981',
  Player:'#64748b',
};

// ── Security questions (matches backend SECURITY_QUESTIONS) ──────────────────

const SECURITY_QUESTIONS = [
  'Nama hewan kesayangan kamu?',
  'Warna apa yang kamu suka?',
  'Apa nama panggilan kamu?',
];

// ── Inline sub-styles (dark cyberpunk theme, complements admin.scss) ──────────

const S = {
  card: {
    background: '#0d0d20',
    border: '1px solid rgba(0,229,255,0.14)',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
  } as React.CSSProperties,
  row: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 4, flex: 1, minWidth: 160 },
  label: { fontSize: 12, fontWeight: 600, color: '#6a7494', marginBottom: 2 },
  input: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,229,255,0.2)',
    fontSize: 13.5, fontFamily: 'Poppins, sans-serif', background: '#070816',
    color: '#c8d0ff', outline: 'none', width: '100%', boxSizing: 'border-box' as const,
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
    background: '#0d0d20', border: '1px solid rgba(0,229,255,0.14)', borderRadius: 12,
    padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 4,
  },
};

// ── GmStatsBar ────────────────────────────────────────────────────────────────

interface GmStats {
  totalAccounts:   number; // userinfofrompublisher — akun game sesungguhnya
  totalPlayers:    number; // userinfo — karakter yang pernah dibuat
  onlinePlayers:   number; // userinfologin WHERE fdServerNum > 0 (dari game server; bisa stale jika server crash)
  totalCash:       number;
  totalTR:         number;
  pendingRequests: number;
}

export function GmStatsBar() {
  const [stats, setStats]                   = useState<GmStats | null>(null);
  const [resetting, setResetting]           = useState(false);
  const [resetMsg, setResetMsg]             = useState<{ text: string; ok: boolean } | null>(null);
  const [maintenance, setMaintenance]       = useState(false);
  const [togglingMaint, setTogglingMaint]   = useState(false);

  const loadStats = useCallback(() => {
    gmFetch('/stats').then(setStats).catch(() => null);
  }, []);

  useEffect(() => {
    loadStats();
    // Load current maintenance status
    fetch('/api/stats/server-status')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setMaintenance(d.status === 'maintenance'); })
      .catch(() => null);
  }, [loadStats]);

  const handleToggleMaint = useCallback(async () => {
    const next = !maintenance;
    if (next && !confirm('Aktifkan mode maintenance? Semua pemain akan melihat server offline.')) return;
    setTogglingMaint(true);
    try {
      const res = await gmFetch('/maintenance', { method: 'POST', body: JSON.stringify({ enabled: next }) });
      setMaintenance(!!res.maintenance);
    } catch { /* silent */ }
    finally { setTogglingMaint(false); }
  }, [maintenance]);

  const handleReset = useCallback(async () => {
    if (!confirm('Reset semua data online? Lakukan ini hanya jika game server sedang mati / crash.')) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await gmFetch('/reset-online', { method: 'POST' });
      setResetMsg({ text: res.message ?? 'Reset berhasil.', ok: true });
      loadStats(); // refresh angka
    } catch (e: any) {
      setResetMsg({ text: e.message ?? 'Gagal reset.', ok: false });
    } finally {
      setResetting(false);
    }
  }, [loadStats]);

  if (!stats) return null;

  const items = [
    { label: 'Total Akun',    value: stats.totalAccounts.toLocaleString('id-ID'),  color: '#6366f1',
      note: 'userinfofrompublisher' },
    { label: 'Total Karakter', value: stats.totalPlayers.toLocaleString('id-ID'),  color: '#8b5cf6',
      note: 'userinfo' },
    { label: 'Online',        value: stats.onlinePlayers.toLocaleString('id-ID'),  color: '#10b981',
      note: 'fdServerNum > 0 (stale jika server crash)' },
    { label: 'Total Cash',    value: stats.totalCash.toLocaleString('id-ID'),      color: '#f59e0b',
      note: '' },
    { label: 'Total TR',      value: stats.totalTR.toLocaleString('id-ID'),        color: '#3b82f6',
      note: '' },
    { label: 'Req. Pending',  value: stats.pendingRequests.toLocaleString('id-ID'),
      color: stats.pendingRequests > 0 ? '#ef4444' : '#6a7494', note: '' },
  ];

  return (
    <div>
      <div style={S.statsGrid}>
        {items.map(({ label, value, color, note }) => (
          <div key={label} style={S.statCard}>
            <span style={{ fontSize: 11.5, color: '#6a7494', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</span>
            {note && (
              <span style={{ fontSize: 9.5, color: '#3a4060', fontFamily: 'monospace', marginTop: 2, lineHeight: 1.3 }}>
                {note}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Maintenance mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <button
          onClick={handleToggleMaint}
          disabled={togglingMaint}
          style={{
            ...S.btn,
            background: maintenance ? '#0d2b1a' : '#1a1a2e',
            color: maintenance ? '#10b981' : '#f59e0b',
            border: `1px solid ${maintenance ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.35)'}`,
            fontSize: 12, padding: '6px 14px',
          }}
        >
          {togglingMaint ? '⏳ Mengubah…' : maintenance ? '✅ Maintenance AKTIF — Klik nonaktifkan' : '🔧 Aktifkan Mode Maintenance'}
        </button>
        <span style={{ fontSize: 11, color: '#3a4060', marginLeft: 'auto' }}>
          Tampilkan server sebagai "Maintenance" ke semua pemain
        </span>
      </div>

      {/* Reset online count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={handleReset}
          disabled={resetting}
          style={{
            ...S.btn,
            background: resetting ? '#1e1e3a' : '#1a1a2e',
            color: resetting ? '#6a7494' : '#ef4444',
            border: '1px solid rgba(239,68,68,0.35)',
            fontSize: 12,
            padding: '6px 14px',
          }}
        >
          {resetting ? '⏳ Mereset…' : '⚠ Reset Online Count'}
        </button>
        {resetMsg && (
          <span style={{ fontSize: 12, color: resetMsg.ok ? '#10b981' : '#ef4444' }}>
            {resetMsg.text}
          </span>
        )}
        <span style={{ fontSize: 11, color: '#3a4060', marginLeft: 'auto' }}>
          Gunakan hanya saat game server crash / offline
        </span>
      </div>
    </div>
  );
}

// ── GmPlayerSection ───────────────────────────────────────────────────────────

type PlayerTab = 'send' | 'inventory' | 'manage';

interface PlayerWebAccount {
  user_id:            string;
  nickname:           string;
  email:              string;
  sec_question:       string;
  sec_answer:         string;
  web_account_exists: boolean;
}

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
  const [mauAmt, setMauAmt]     = useState('');
  const [expAmt, setExpAmt]     = useState('');
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

  // player web account (Owner only)
  const [playerWebAcct, setPlayerWebAcct] = useState<PlayerWebAccount | null>(null);
  const [webAcctEmail, setWebAcctEmail]   = useState('');
  const [webAcctSecQ, setWebAcctSecQ]     = useState('');
  const [webAcctSecA, setWebAcctSecA]     = useState('');
  const [webAcctLoading, setWebAcctLoading] = useState(false);

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
    setPlayerWebAcct(null); setWebAcctEmail(''); setWebAcctSecQ(''); setWebAcctSecA('');
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

  // load player web account
  const loadPlayerWebAccount = useCallback(async () => {
    if (!player || !isOwner) return;
    setWebAcctLoading(true);
    try {
      const data: PlayerWebAccount = await gmFetch(`/players/${player.fdUserNum}/web-account`);
      setPlayerWebAcct(data);
      setWebAcctEmail(data.email ?? '');
      setWebAcctSecQ(data.sec_question ?? '');
      setWebAcctSecA('');
    } catch { setPlayerWebAcct(null); }
    finally { setWebAcctLoading(false); }
  }, [player?.fdUserNum, isOwner]); // eslint-disable-line

  useEffect(() => {
    if (playerTab === 'inventory' && player) loadInventory();
  }, [playerTab, player?.fdUserNum]); // eslint-disable-line

  useEffect(() => {
    if (playerTab === 'manage' && player && isOwner) loadPlayerWebAccount();
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

  const doUpdateWebAccount = () => act(async () => {
    const r = await gmFetch(`/players/${player!.fdUserNum}/web-account`, {
      method: 'PATCH',
      body: JSON.stringify({ email: webAcctEmail, sec_question: webAcctSecQ, sec_answer: webAcctSecA }),
    });
    setWebAcctSecA('');
    await loadPlayerWebAccount();
    return r;
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
        background: playerTab === tab ? '#6366f1' : '#10102a',
        color:      playerTab === tab ? '#fff' : '#c8d0ff',
        fontSize: 12,
        border: playerTab === tab ? 'none' : '1px solid rgba(0,229,255,0.14)',
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
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,229,255,0.14)', fontWeight: 700, fontSize: 13.5, color: '#c8d0ff' }}>
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
                    <tr key={p.fdUserNum} style={{ background: player?.fdUserNum === p.fdUserNum ? 'rgba(49,242,255,0.05)' : undefined }}>
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
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid rgba(0,229,255,0.14)' }}>
              <div style={{ flex: 2, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6a7494', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Player Aktif
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#c8d0ff', marginBottom: 4 }}>
                  {player.fdNickname}
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: ROLE_COLOR[player.RoleName] ?? '#64748b', color: '#fff', verticalAlign: 'middle' }}>
                    {player.RoleName}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6a7494' }}>
                  UserNum: <b style={{ color: '#c8d0ff' }}>{player.fdUserNum}</b> · ID: <b style={{ color: '#c8d0ff' }}>{player.UserId || '–'}</b>
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
                  <div style={{ fontSize: 10, color: '#6a7494', fontWeight: 700, letterSpacing: '0.05em' }}>CASH</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>
                    {Number(player.Cash).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6a7494', fontWeight: 700, letterSpacing: '0.05em' }}>TR</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#3b82f6' }}>
                    {Number(player.GameMoney).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6a7494', fontWeight: 700, letterSpacing: '0.05em' }}>MAU</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>
                    {Number(player.Mau).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#6a7494', fontWeight: 700, letterSpacing: '0.05em' }}>EXP</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>
                    {Number(player.Exp).toLocaleString('id-ID')}
                  </div>
                </div>
                {player.fdLoginCount !== undefined && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#6a7494', fontWeight: 700, letterSpacing: '0.05em' }}>LOGIN</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#6a7494' }}>
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
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#f59e0b' }}>💰 Cash</div>
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
                  <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#60a5fa' }}>⚔️ TR</div>
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
                  <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#a78bfa' }}>✨ MAU</div>
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
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#34d399' }}>🌟 EXP Player <span style={{ fontSize: 11, fontWeight: 400, color: '#6a7494' }}>(Owner only — langsung diterapkan)</span></div>
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
                <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, color: '#fb923c' }}>🎁 Kirim Item</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input style={{ ...S.input, flex: 1 }} placeholder="Cari nama atau #kode item"
                      value={itemQ} onChange={e => setItemQ(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchItems()} />
                    <button style={{ ...S.btn, background: '#f97316', color: '#fff', padding: '8px 12px', fontSize: 12 }}
                      onClick={searchItems}>🔍 Cari</button>
                  </div>
                  {itemResults.length > 0 && (
                    <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 6, marginBottom: 8 }}>
                      {itemResults.map(item => (
                        <div key={item.fdItemNum}
                          onClick={() => { setSelItem(item); setItemResults([]); setItemQ(item.fdItemName); }}
                          style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12,
                            background: selItem?.fdItemNum === item.fdItemNum ? 'rgba(249,115,22,0.2)' : '#070816',
                            borderBottom: '1px solid rgba(249,115,22,0.1)', color: '#c8d0ff',
                          }}
                        >
                          <span style={{ fontFamily: 'monospace', color: '#6a7494', marginRight: 6 }}>#{item.fdItemNum}</span>
                          {item.fdItemName}
                        </div>
                      ))}
                    </div>
                  )}
                  {selItem && (
                    <div style={{ marginBottom: 8, padding: '6px 12px', background: 'rgba(249,115,22,0.15)', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#c8d0ff' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                      <span><b>#{selItem.fdItemNum}</b> {selItem.fdItemName}</span>
                      <button type="button" onClick={() => { setSelItem(null); setItemQ(''); }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6a7494', fontSize: 16, lineHeight: 1 }}>×</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {(['Giftbox', 'Warehouse'] as const).map(d => (
                      <button key={d} onClick={() => setDelivery(d)}
                        style={{ ...S.btn, flex: 1, justifyContent: 'center', fontSize: 12,
                          background: delivery === d ? '#f97316' : '#10102a',
                          color: delivery === d ? '#fff' : '#c8d0ff',
                          border: delivery === d ? 'none' : '1px solid rgba(0,229,255,0.14)' }}
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
                  <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#c8d0ff' }}>
                      Tambah Exp — {extendTarget.name}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input style={{ ...S.input, maxWidth: 180 }} type="number" min="1" max="1000000000"
                        placeholder="Jumlah exp" value={extendExp} onChange={e => setExtendExp(e.target.value)} />
                      <button style={{ ...S.btn, background: '#3b82f6', color: '#fff' }}
                        onClick={doExtendExp} disabled={loading || !extendExp}>
                        {isOwner ? 'Tambah' : 'Request'}
                      </button>
                      <button style={{ ...S.btn, background: '#10102a', color: '#c8d0ff', border: '1px solid rgba(0,229,255,0.14)' }}
                        onClick={() => { setExtendTarget(null); setExtendExp(''); }}>
                        Batal
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#6a7494', marginTop: 6 }}>
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
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6a7494', padding: 24 }}>Memuat…</td></tr>
                      )}
                      {!invLoading && inventory.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6a7494', padding: 24 }}>
                          Inventory kosong.
                        </td></tr>
                      )}
                      {inventory.map(item => {
                        const expired = item.fdExpireDateTime && new Date(item.fdExpireDateTime) < new Date();
                        return (
                          <tr key={item.fdNum}>
                            <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#6a7494' }}>{item.fdNum}</td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.ItemName}</div>
                              <div style={{ fontSize: 11, color: '#6a7494' }}>#{item.fdItemDescNum}</div>
                            </td>
                            <td style={{ fontSize: 12 }}>{item.fdExp.toLocaleString('id-ID')}</td>
                            <td style={{ fontSize: 12, color: expired ? '#ef4444' : '#6a7494' }}>
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
                  <div style={{ fontSize: 12, color: '#6a7494', marginTop: 8 }}>
                    GM: hapus dan extend exp akan membuat request ke Owner.
                  </div>
                )}
              </div>
            )}

            {/* === Tab: Kelola (Owner only) === */}
            {playerTab === 'manage' && isOwner && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {/* Ban / Unban */}
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5, color: '#c8d0ff' }}>
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
                <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5, color: '#c8d0ff' }}>🏷️ Ubah Role</div>
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
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5, color: '#c8d0ff' }}>✏️ Ubah Nickname</div>
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
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5, color: '#c8d0ff' }}>🔑 Reset Password</div>
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
                <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13.5, color: '#c8d0ff' }}>
                    ⭐ Piero Account
                    {player.Attribute === 1 && (
                      <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: 11,
                        background: '#0ea5e9', color: '#fff' }}>AKTIF</span>
                    )}
                  </div>
                  {player.Attribute === 1 ? (
                    <button
                      style={{ ...S.btn, background: '#6a7494', color: '#fff', marginBottom: 12, width: '100%', justifyContent: 'center' }}
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
                              width: 22, height: 22, borderRadius: '50%', border: pieroColor === c ? '2px solid #00e5ff' : '2px solid transparent',
                              background: PIERO_SWATCH[c], cursor: 'pointer', padding: 0, outline: 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Web Account (Email & Security Question) */}
                <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '16px 18px', gridColumn: 'span 2' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13.5, color: '#c8d0ff' }}>
                    🌐 Akun Web Player
                    {playerWebAcct && (
                      <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: playerWebAcct.web_account_exists ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)',
                        color: playerWebAcct.web_account_exists ? '#34d399' : '#6a7494' }}>
                        {playerWebAcct.web_account_exists ? 'Terdaftar' : 'Belum ada'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#6a7494', marginBottom: 14 }}>
                    Update email dan pertanyaan keamanan akun web player (tabel tales_hero_web_users).
                  </div>
                  {webAcctLoading ? (
                    <div style={{ color: '#6a7494', fontSize: 13, padding: '10px 0' }}>Memuat info akun web…</div>
                  ) : (
                    <>
                      {playerWebAcct && playerWebAcct.email && (
                        <div style={{ fontSize: 12, color: '#6a7494', marginBottom: 10, padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                          📧 Email saat ini: <span style={{ color: '#c8d0ff' }}>{playerWebAcct.email}</span>
                          {playerWebAcct.sec_question && (
                            <><br/>🔐 Pertanyaan: <span style={{ color: '#c8d0ff' }}>{playerWebAcct.sec_question}</span></>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
                        <div style={S.field}>
                          <label style={S.label}>Email Baru</label>
                          <input style={S.input} type="email" placeholder="email@player.com"
                            value={webAcctEmail} onChange={e => setWebAcctEmail(e.target.value)} />
                        </div>
                        <div style={S.field}>
                          <label style={S.label}>Pertanyaan Keamanan</label>
                          <select style={{ ...S.input, cursor: 'pointer' }}
                            value={webAcctSecQ} onChange={e => setWebAcctSecQ(e.target.value)}>
                            <option value="">-- Pilih Pertanyaan --</option>
                            {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                        <div style={{ ...S.field, gridColumn: '1/-1' }}>
                          <label style={S.label}>Jawaban Keamanan Baru</label>
                          <input style={S.input} type="text" placeholder="Jawaban baru"
                            value={webAcctSecA} onChange={e => setWebAcctSecA(e.target.value)} />
                        </div>
                      </div>
                      <button
                        style={{ ...S.btn, background: '#6366f1', color: '#fff', marginTop: 12, fontSize: 12 }}
                        onClick={doUpdateWebAccount}
                        disabled={loading || !webAcctEmail || !webAcctSecQ || !webAcctSecA}
                      >
                        ✓ Simpan Akun Web
                      </button>
                    </>
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
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#c8d0ff' }}>Tolak Request #{rejectId}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="Alasan penolakan (opsional)"
                value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
              <button style={{ ...S.btn, background: '#ef4444', color: '#fff' }}
                onClick={doReject} disabled={acting}>Tolak</button>
              <button style={{ ...S.btn, background: '#10102a', color: '#c8d0ff', border: '1px solid rgba(0,229,255,0.14)' }}
                onClick={() => { setRejectId(null); setRejectNote(''); }}>Batal</button>
            </div>
          </div>
        )}

        {/* Pending */}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '14px 20px', background: 'rgba(249,115,22,0.1)', borderBottom: '1px solid rgba(249,115,22,0.3)', fontWeight: 700, fontSize: 13.5, color: '#fb923c' }}>
            ⏳ Pending ({pending.length})
          </div>
          {loading
            ? <div style={{ padding: 24, textAlign: 'center', color: '#6a7494' }}>Memuat…</div>
            : pending.length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: '#6a7494' }}>Tidak ada request pending.</div>
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
                        <td style={{ fontSize: 12 }}>{r.fdRequestedByNickname}<br/><span style={{ color: '#6a7494' }}>{r.fdRequestedByUserId}</span></td>
                        <td style={{ fontSize: 12 }}>{r.fdTargetNickname}</td>
                        <td style={{ fontSize: 12 }}>
                          {r.fdAmount > 0 && <div>{Number(r.fdAmount).toLocaleString('id-ID')}</div>}
                          {r.fdItemName && <div>🎁 {r.fdItemName} {r.fdDeliveryTarget && `(${r.fdDeliveryTarget})`}</div>}
                          {r.fdNote && <div style={{ color: '#6a7494', fontSize: 11 }}>{r.fdNote.slice(0, 80)}</div>}
                        </td>
                        <td style={{ fontSize: 11, color: '#6a7494', whiteSpace: 'nowrap' }}>
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
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,229,255,0.14)', fontWeight: 700, fontSize: 13.5, color: '#c8d0ff' }}>
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
                      <td style={{ fontSize: 11, color: '#6a7494', whiteSpace: 'nowrap' }}>
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
    SEND_CASH:                       '#f59e0b',
    SEND_TR:                         '#3b82f6',
    SEND_MAU:                        '#7c3aed',
    SEND_EXP:                        '#10b981',
    SEND_ITEM:                       '#10b981',
    BAN_PLAYER:                      '#ef4444',
    UNBAN_PLAYER:                    '#10b981',
    UPDATE_ROLE:                     '#7c3aed',
    CHANGE_NICKNAME:                 '#6366f1',
    CHANGE_PASSWORD:                 '#f97316',
    DELETE_INVENTORY:                '#dc2626',
    EXTEND_INVENTORY_EXP:            '#3b82f6',
    APPROVE_REQUEST:                 '#10b981',
    REJECT_REQUEST:                  '#ef4444',
    SET_PIERO_ACCOUNT:               '#0ea5e9',
    SET_PIERO_COLOR:                 '#0284c7',
    UPDATE_WEB_ACCOUNT:              '#6366f1',
    OWNER_UPDATE_PLAYER_WEB_ACCOUNT: '#6366f1',
    OWNER_CHANGE_PLAYER_PASSWORD:    '#f97316',
    OWNER_CHANGE_PLAYER_NICKNAME:    '#6366f1',
    OWNER_SET_PIERO_ACCOUNT:         '#0ea5e9',
    OWNER_SET_PIERO_COLOR:           '#0284c7',
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
            ? <div style={{ padding: 32, textAlign: 'center', color: '#6a7494' }}>Memuat log…</div>
            : logs.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', color: '#6a7494' }}>Belum ada log aktivitas.</div>
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
                          <div style={{ fontSize: 11, color: '#6a7494' }}>{log.fdActorUserId}</div>
                        </td>
                        <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{log.fdTargetInfo}</td>
                        <td style={{ fontSize: 12, color: '#6a7494', maxWidth: 220, wordBreak: 'break-word' }}>
                          {log.fdDetail}
                        </td>
                        <td style={{ fontSize: 11, color: '#6a7494', whiteSpace: 'nowrap' }}>
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
