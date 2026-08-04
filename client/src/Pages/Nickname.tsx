import { useState } from 'react';
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
} from 'react-icons/io5';
import { GiTwoCoins } from 'react-icons/gi';
import { IoCashOutline } from 'react-icons/io5';
import { MdStars } from 'react-icons/md';

// ── Harga per metode ─────────────────────────────────────────
const PAY_OPTIONS = [
    {
        id: 'tr',
        label: 'TR (Game Money)',
        price: 200_000,
        icon: <GiTwoCoins size={22} className="pay-option__icon pay-option__icon--tr" />,
        color: '#f5a623',
    },
    {
        id: 'cash',
        label: 'Cash',
        price: 150_000,
        icon: <IoCashOutline size={22} className="pay-option__icon pay-option__icon--cash" />,
        color: '#e83e8c',
    },
    {
        id: 'mau',
        label: 'MAU',
        price: 78_000,
        icon: <MdStars size={22} className="pay-option__icon pay-option__icon--mau" />,
        color: '#7b5ea7',
    },
] as const;

type PayMethod = 'tr' | 'cash' | 'mau';

const STARS = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${(i * 7.1) % 100}%`,
    top: `${(i * 6.7) % 90}%`,
    delay: `${(i * 0.25) % 3}s`,
    duration: `${2 + (i % 4) * 0.5}s`,
    size: `${4 + (i % 4)}px`,
}));

function fmt(n: number) {
    return n.toLocaleString('id-ID');
}

export default function Nickname() {
    usePageMeta({
        title: 'Ganti Nickname — Tales Hero Indonesia',
        description: 'Ganti nickname akun Tales Hero Indonesia-mu.',
    });

    const { user, loading: authLoading, updateUser } = useAuth();
    const [, setLocation] = useLocation();

    const [nickname, setNickname]       = useState('');
    const [payMethod, setPayMethod]     = useState<PayMethod>('tr');
    const [loading, setLoading]         = useState(false);
    const [success, setSuccess]         = useState('');
    const [error, setError]             = useState('');
    const [fieldError, setFieldError]   = useState('');

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

    // ── Validate on client ────────────────────────────────────
    function validate(val: string): string {
        if (!val.trim()) return 'Nickname tidak boleh kosong.';
        if (val.trim().length < 5) return 'Nickname minimal 5 karakter.';
        if (val.trim().length > 10) return 'Nickname maksimal 10 karakter.';
        if (!/^[a-zA-Z0-9]+$/.test(val.trim()))
            return 'Hanya huruf dan angka yang diizinkan (tanpa spasi atau underscore).';
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
                body: JSON.stringify({ nickname: nickname.trim(), payMethod }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.message ?? 'Gagal mengganti nickname.');
            } else {
                setSuccess(data?.message ?? 'Nickname berhasil diubah.');
                setNickname('');
                // update displayed nickname in auth context
                if (data?.nickname) updateUser({ nickname: data.nickname });
            }
        } catch {
            setError('Tidak dapat terhubung ke server.');
        } finally {
            setLoading(false);
        }
    }

    const selectedOption = PAY_OPTIONS.find(o => o.id === payMethod)!;

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
                        {/* Header */}
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
                            <p className="nickname-page__subtitle">
                                Nickname saat ini:{' '}
                                <strong style={{ color: '#e83e8c' }}>
                                    {user.nickname || <em style={{ color: '#aaa' }}>belum ada nickname</em>}
                                </strong>
                            </p>
                        </div>

                        {/* Avatar */}
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
                                <span className="nickname-page__username-label">Username</span>
                                <span className="nickname-page__username-value">{user.username}</span>
                            </div>
                        </div>

                        {/* Saldo */}
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

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="nickname-page__form" noValidate>
                            {/* Input nickname */}
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
                                    autoFocus
                                />
                                <div className="nickname-page__input-meta">
                                    {fieldError
                                        ? <span className="akun-form-error">{fieldError}</span>
                                        : <span className="akun-form-hint">
                                            Huruf dan angka saja — minimal 5, maksimal 10 karakter
                                          </span>
                                    }
                                    <span className="nickname-page__char-count"
                                        style={{ color: nickname.length > 8 ? '#e83e8c' : undefined }}>
                                        {nickname.length}/10
                                    </span>
                                </div>
                            </div>

                            {/* Metode pembayaran */}
                            <div className="akun-form-group">
                                <label className="akun-form-label">Metode Pembayaran</label>
                                <div className="nickname-page__pay-options">
                                    {PAY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            className={`nickname-page__pay-option${payMethod === opt.id ? ' nickname-page__pay-option--active' : ''}`}
                                            style={payMethod === opt.id ? { borderColor: opt.color, backgroundColor: `${opt.color}18` } : {}}
                                            onClick={() => { setPayMethod(opt.id); setError(''); }}
                                            aria-pressed={payMethod === opt.id}
                                        >
                                            {opt.icon}
                                            <span className="pay-option__label">{opt.label}</span>
                                            <span className="pay-option__price"
                                                style={payMethod === opt.id ? { color: opt.color } : {}}>
                                                {fmt(opt.price)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pesan sukses / error */}
                            {success && (
                                <motion.div
                                    className="akun-feedback akun-feedback--success"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}>
                                    <IoCheckmarkCircle size={18} />
                                    {success}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    className="akun-feedback akun-feedback--error"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}>
                                    <IoAlertCircleOutline size={18} />
                                    {error}
                                </motion.div>
                            )}

                            {/* Catatan biaya */}
                            <p className="nickname-page__note">
                                Kamu akan membayar{' '}
                                <strong style={{ color: selectedOption.color }}>
                                    {fmt(selectedOption.price)} {selectedOption.label}
                                </strong>{' '}
                                untuk mengganti nickname.
                            </p>

                            <button
                                type="submit"
                                className="akun-btn akun-btn--pink akun-btn--full"
                                disabled={loading || !!fieldError}
                            >
                                {loading ? 'Memproses…' : 'Ganti Nickname'}
                            </button>
                        </form>

                        {/* Syarat & ketentuan */}
                        <ul className="nickname-page__rules">
                            <li>Minimal 5 karakter, maksimal 10 karakter</li>
                            <li>Hanya huruf dan angka (tanpa spasi atau underscore)</li>
                            <li>Tidak boleh mengandung kata-kata tidak sopan</li>
                            <li>Pembayaran langsung dipotong saat konfirmasi</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}
