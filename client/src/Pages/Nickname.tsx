import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import { useAuth } from '@/Hooks/use-auth';
import { asset } from '@/Lib/utils';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import FormSkeleton from '@/Components/FormSkeleton';
import {
    IoPersonCircleOutline,
    IoCheckmarkCircle,
    IoAlertCircleOutline,
    IoArrowBackOutline,
    IoCreateOutline,
    IoTimeOutline,
} from 'react-icons/io5';
import { GiTwoCoins } from 'react-icons/gi';
import { IoCashOutline } from 'react-icons/io5';
import { MdStars, MdHistory } from 'react-icons/md';

// ── Biaya tetap (harus bayar ketiganya) ──────────────────────
const COST = [
    { id: 'tr',   label: 'TR',   amount: 150_000,  icon: <GiTwoCoins size={16} />, color: '#f5a623' },
    { id: 'cash', label: 'Cash', amount: 200_000,  icon: <IoCashOutline size={16} />, color: '#e83e8c' },
    { id: 'mau',  label: 'MAU',  amount: 20_000,  icon: <MdStars size={16} />, color: '#7b5ea7' },
];

const STARS = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${(i * 7.1) % 100}%`,
    top: `${(i * 6.7) % 90}%`,
    delay: `${(i * 0.25) % 3}s`,
    duration: `${2 + (i % 4) * 0.5}s`,
    size: `${4 + (i % 4)}px`,
}));

function fmt(n: number) { return n.toLocaleString('id-ID'); }

interface LogEntry { old_nickname: string; new_nickname: string; changed_at: string; }
interface LogsData  { logs: LogEntry[]; totalChanges: number; cooldownDaysLeft: number; }

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function NicknamePage() {
    usePageMeta({
        title: 'Ganti Nickname — Tales Hero Indonesia',
        description: 'Ganti nickname akun Tales Hero Indonesia-mu.',
    });

    const { user, loading: authLoading, updateUser } = useAuth();
    const [, setLocation] = useLocation();

    const [nickname,    setNickname]    = useState('');
    const [loading,     setLoading]     = useState(false);
    const [success,     setSuccess]     = useState('');
    const [error,       setError]       = useState('');
    const [fieldError,  setFieldError]  = useState('');
    const [logsData,    setLogsData]    = useState<LogsData | null>(null);
    const [logsLoading, setLogsLoading] = useState(false);

    // Fetch riwayat & cooldown
    useEffect(() => {
        if (!user) return;
        setLogsLoading(true);
        fetch('/auth/nickname-logs', { credentials: 'include' })
            .then(r => r.json())
            .then(d => setLogsData(d))
            .catch(() => {})
            .finally(() => setLogsLoading(false));
    }, [user?.username]);

    // ── Guard states ──────────────────────────────────────────
    if (authLoading) {
        return (
            <>
                <Header />
                <div className="cs-page cs-page--login">
                    <div className="cs-page__card cs-page__card--account">
                        <FormSkeleton rows={3} label="Memeriksa sesi..." />
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Header />
                <div className="cs-page cs-page--login">
                    <div className="cs-page__bg">
                        {STARS.map(s => (
                            <span key={s.id} className="cs-page__star" style={{
                                left: s.left, top: s.top,
                                width: s.size, height: s.size,
                                animationDelay: s.delay, animationDuration: s.duration,
                            }} />
                        ))}
                    </div>
                    <motion.div className="cs-page__card"
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                        <div className="akun-card akun-card--guest" style={{ textAlign: 'center' }}>
                            <IoPersonCircleOutline size={56} color="#ccc" />
                            <p style={{ margin: '16px 0 8px', fontWeight: 700, color: '#1a1a2e' }}>Kamu belum login</p>
                            <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Masuk dulu untuk mengganti nickname.</p>
                            <button className="akun-btn akun-btn--pink" onClick={() => setLocation('/login')}>
                                <IoPersonCircleOutline size={16} /> Masuk Sekarang
                            </button>
                        </div>
                    </motion.div>
                </div>
                <Footer />
            </>
        );
    }

    // ── Client-side validation ────────────────────────────────
    function validate(val: string): string {
        if (!val) return 'Nickname tidak boleh kosong.';
        if (val.length < 5)  return 'Nickname minimal 5 karakter.';
        if (val.length > 10) return 'Nickname maksimal 10 karakter.';
        if (/\s/.test(val))  return 'Nickname tidak boleh mengandung spasi.';
        if (!/^[a-zA-Z0-9]+$/.test(val))
            return 'Hanya huruf (A-Z, a-z) dan angka (0-9). Karakter spesial tidak diizinkan.';
        return '';
    }

    function handleNicknameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setNickname(val);
        setFieldError(validate(val));
        setError('');
        setSuccess('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const err = validate(nickname);
        if (err) { setFieldError(err); return; }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/auth/change-nickname', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.message ?? 'Gagal mengganti nickname.');
            } else {
                setSuccess(data?.message ?? 'Nickname berhasil diubah.');
                setNickname('');
                if (data?.nickname) updateUser({ nickname: data.nickname });
                // Refresh logs
                fetch('/auth/nickname-logs', { credentials: 'include' })
                    .then(r => r.json())
                    .then(d => setLogsData(d))
                    .catch(() => {});
            }
        } catch {
            setError('Tidak dapat terhubung ke server.');
        } finally {
            setLoading(false);
        }
    }

    const onCooldown = (logsData?.cooldownDaysLeft ?? 0) > 0;

    // ── Render ────────────────────────────────────────────────
    return (
        <>
            <Header />
            <div className="cs-page cs-page--login">
                <div className="cs-page__bg">
                    {STARS.map(s => (
                        <span key={s.id} className="cs-page__star" style={{
                            left: s.left, top: s.top,
                            width: s.size, height: s.size,
                            animationDelay: s.delay, animationDuration: s.duration,
                        }} />
                    ))}
                </div>

                <motion.div className="cs-page__card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}>

                    <div className="akun-card" style={{ maxWidth: 480 }}>

                        {/* ── Header ── */}
                        <div className="nickname-page__header">
                            <button
                                className="nickname-page__back"
                                onClick={() => setLocation('/akun')}
                                aria-label="Kembali ke Info Akun"
                            >
                                <IoArrowBackOutline size={18} />
                                Kembali
                            </button>
                            <div className="nickname-page__title-row">
                                <IoCreateOutline size={26} className="nickname-page__title-icon" />
                                <h2 className="nickname-page__title">Ganti Nickname</h2>
                            </div>
                        </div>

                        {/* ── Avatar + Nickname game ── */}
                        <div className="nickname-page__avatar-row">
                            <img
                                src={user.character
                                    ? asset(`/Image/Karakter/Avatar/${user.character}.png`)
                                    : asset('/Image/Account/IMG-DEFAULT-01.png')}
                                alt={user.character ?? 'avatar'}
                                className="nickname-page__avatar"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                        asset('/Image/Account/IMG-DEFAULT-01.png');
                                }}
                            />
                            <div className="nickname-page__username">
                                <span className="nickname-page__username-label">Nickname Game</span>
                                <span className="nickname-page__username-value">
                                    {user.nickname || <em style={{ color: '#aaa', fontWeight: 400 }}>belum ada nickname</em>}
                                </span>
                            </div>
                        </div>

                        {/* ── Saldo ── */}
                        <div className="nickname-page__balance">
                            <div className="nickname-page__balance-item">
                                <GiTwoCoins size={16} style={{ color: '#f5a623' }} />
                                <span>TR</span>
                                <strong>{fmt(user.tr)}</strong>
                            </div>
                            <div className="nickname-page__balance-item">
                                <IoCashOutline size={16} style={{ color: '#e83e8c' }} />
                                <span>Cash</span>
                                <strong>{fmt(user.cash)}</strong>
                            </div>
                            <div className="nickname-page__balance-item">
                                <MdStars size={16} style={{ color: '#7b5ea7' }} />
                                <span>MAU</span>
                                <strong>{fmt(user.mau)}</strong>
                            </div>
                        </div>

                        {/* ── Cooldown warning ── */}
                        {onCooldown && (
                            <motion.div className="nickname-page__cooldown"
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                                <IoTimeOutline size={18} />
                                <span>
                                    Kamu baru mengganti nickname.
                                    Tersedia lagi dalam <strong>{logsData!.cooldownDaysLeft} hari</strong>.
                                </span>
                            </motion.div>
                        )}

                        {/* ── Form ── */}
                        <form onSubmit={handleSubmit} className="nickname-page__form" noValidate>

                            {/* Input */}
                            <div className="akun-form-group">
                                <label className="akun-form-label" htmlFor="new-nickname">
                                    Nickname Baru
                                </label>
                                <input
                                    id="new-nickname"
                                    type="text"
                                    className={`akun-form-input${fieldError ? ' akun-form-input--error' : ''}`}
                                    value={nickname}
                                    onChange={handleNicknameChange}
                                    placeholder="5–10 karakter, huruf & angka"
                                    maxLength={10}
                                    autoComplete="off"
                                    disabled={onCooldown}
                                />
                                <div className="nickname-page__input-meta">
                                    {fieldError
                                        ? <span className="akun-form-error">{fieldError}</span>
                                        : <span className="akun-form-hint">Huruf (A-Z, a-z) & angka (0-9) — tanpa spasi / karakter spesial</span>
                                    }
                                    <span className="nickname-page__char-count"
                                        style={{ color: nickname.length > 8 ? '#e83e8c' : undefined }}>
                                        {nickname.length}/10
                                    </span>
                                </div>
                            </div>

                            {/* Biaya tetap */}
                            <div className="akun-form-group">
                                <label className="akun-form-label">Biaya Penggantian</label>
                                <div className="nickname-page__cost-box">
                                    {COST.map(c => (
                                        <div key={c.id} className="nickname-page__cost-row">
                                            <span className="nickname-page__cost-icon" style={{ color: c.color }}>
                                                {c.icon}
                                            </span>
                                            <span className="nickname-page__cost-label">{c.label}</span>
                                            <span className="nickname-page__cost-amount" style={{ color: c.color }}>
                                                {fmt(c.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <p className="nickname-page__cost-note">
                                        Ketiga biaya di atas akan dipotong sekaligus saat konfirmasi.
                                    </p>
                                </div>
                            </div>

                            {/* Feedback */}
                            {success && (
                                <motion.div className="akun-feedback akun-feedback--success"
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                                    <IoCheckmarkCircle size={18} />
                                    {success}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div className="akun-feedback akun-feedback--error"
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                                    <IoAlertCircleOutline size={18} />
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                className="akun-btn akun-btn--pink akun-btn--full"
                                disabled={loading || !!fieldError || onCooldown}
                            >
                                {loading ? 'Memproses…' : 'Ganti Nickname'}
                            </button>
                        </form>

                        {/* ── Riwayat perubahan ── */}
                        <div className="nickname-page__logs">
                            <div className="nickname-page__logs-header">
                                <MdHistory size={16} />
                                <span>
                                    Riwayat Perubahan
                                    {logsData && (
                                        <em className="nickname-page__logs-count">
                                            {' '}({logsData.totalChanges}×)
                                        </em>
                                    )}
                                </span>
                            </div>
                            {logsLoading ? (
                                <p className="nickname-page__logs-empty">Memuat…</p>
                            ) : !logsData?.logs.length ? (
                                <p className="nickname-page__logs-empty">Belum pernah mengganti nickname.</p>
                            ) : (
                                <ul className="nickname-page__logs-list">
                                    {logsData.logs.map((log, i) => (
                                        <li key={i} className="nickname-page__logs-item">
                                            <div className="nickname-page__logs-names">
                                                <span className="nickname-page__logs-old">
                                                    {log.old_nickname || '—'}
                                                </span>
                                                <span className="nickname-page__logs-arrow">→</span>
                                                <span className="nickname-page__logs-new">{log.new_nickname}</span>
                                            </div>
                                            <time className="nickname-page__logs-date">
                                                {formatDate(log.changed_at)}
                                            </time>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* ── Syarat & ketentuan ── */}
                        <ul className="nickname-page__rules">
                            <li>Minimal 5 karakter, maksimal 10 karakter</li>
                            <li>Hanya huruf kapital (A–Z), huruf kecil (a–z) &amp; angka (0–9)</li>
                            <li>Tidak boleh mengandung spasi atau karakter spesial</li>
                            <li>Tidak boleh mengandung kata-kata tidak sopan</li>
                            <li>Hanya bisa diganti sekali setiap <strong>14 hari</strong></li>
                            <li>Biaya: 50.000 TR + 15.000 Cash + 20.000 MAU (dipotong sekaligus)</li>
                        </ul>

                    </div>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}
