import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoGiftOutline, IoCloseOutline, IoAlertCircleOutline, IoReloadOutline } from 'react-icons/io5';
import { useAuth } from '@/Hooks/use-auth';
import { asset } from '@/Lib/utils';

interface RewardItem { num: number; name: string; delivery: string; }
interface Reward { cash: number; tr: number; items: RewardItem[]; summary: string; }

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess?: (reward: Reward) => void;
}

// ── Confetti particle data (generated once per mount) ─────────────────────────
const CONFETTI_COLORS = [
    '#e91e63','#f06292','#ff9800','#ffd740','#00e5ff',
    '#69f0ae','#7c4dff','#ff6d00','#f44336','#40c4ff',
];
function makeParticles(n: number) {
    return Array.from({ length: n }, (_, i) => ({
        id: i,
        x:     Math.random() * 100,        // % across modal width
        delay: Math.random() * 0.55,
        dur:   0.9 + Math.random() * 0.7,
        rot:   Math.random() * 360,
        size:  5 + Math.random() * 6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
    }));
}

// ── SuccessScreen ─────────────────────────────────────────────────────────────
function SuccessScreen({ reward, onClose, onRedeemAgain }: {
    reward: Reward;
    onClose: () => void;
    onRedeemAgain: () => void;
}) {
    const particles = useMemo(() => makeParticles(28), []);

    const rewards: { label: string; value: string; color: string }[] = [];
    if (reward.cash > 0) rewards.push({ label: 'Cash',  value: reward.cash.toLocaleString('id-ID'), color: '#f59e0b' });
    if (reward.tr   > 0) rewards.push({ label: 'TR',    value: reward.tr.toLocaleString('id-ID'),   color: '#3b82f6' });

    return (
        <div className="redeem-success">
            {/* Confetti */}
            <div className="redeem-success__confetti" aria-hidden>
                {particles.map(p => (
                    <motion.span
                        key={p.id}
                        className="redeem-success__particle"
                        style={{
                            left: `${p.x}%`,
                            width: p.size,
                            height: p.shape === 'rect' ? p.size * 0.45 : p.size,
                            borderRadius: p.shape === 'circle' ? '50%' : 2,
                            background: p.color,
                        }}
                        initial={{ y: -16, opacity: 1, rotate: 0 }}
                        animate={{ y: 340, opacity: [1, 1, 0], rotate: p.rot }}
                        transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
                    />
                ))}
            </div>

            {/* Close */}
            <button className="redeem-modal__close redeem-success__close-btn" onClick={onClose} aria-label="Tutup">
                <IoCloseOutline size={20} />
            </button>

            {/* Check icon */}
            <motion.div
                className="redeem-success__check"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20, delay: 0.15 }}
            >
                ✓
            </motion.div>

            <motion.h3
                className="redeem-success__heading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                Yeay! Berhasil ditukarkan!
            </motion.h3>

            <motion.p
                className="redeem-success__sub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                Hadiahmu sudah dikirim ke karakter kamu.
            </motion.p>

            {/* Reward rows: cash/TR */}
            {rewards.length > 0 && (
                <motion.div
                    className="redeem-success__currency-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                >
                    {rewards.map(r => (
                        <div key={r.label} className="redeem-success__currency-chip" style={{ borderColor: r.color + '55' }}>
                            <span style={{ color: r.color, fontWeight: 800, fontSize: 15 }}>+{r.value}</span>
                            <span style={{ color: '#888', fontSize: 11, fontWeight: 600 }}>{r.label}</span>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Item grid */}
            {reward.items.length > 0 && (
                <motion.div
                    className="redeem-success__items"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    {reward.items.map((item, i) => (
                        <div key={i} className="redeem-success__item-card">
                            <div className="redeem-success__item-img-wrap">
                                <img
                                    src={asset(`/Image/Item/${item.num}.png`)}
                                    alt={item.name}
                                    className="redeem-success__item-img"
                                    onError={e => {
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                        (e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'flex';
                                    }}
                                />
                                <div className="redeem-success__item-fallback" style={{ display: 'none' }}>
                                    <IoGiftOutline size={22} color="#e91e63" />
                                </div>
                            </div>
                            <span className="redeem-success__item-name">{item.name}</span>
                            <span className={`redeem-success__item-badge redeem-success__item-badge--${item.delivery.toLowerCase()}`}>
                                {item.delivery}
                            </span>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Actions */}
            <motion.div
                className="redeem-success__actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                <button className="redeem-success__btn-again" onClick={onRedeemAgain}>
                    <IoReloadOutline size={14} /> Redeem Kode Lain
                </button>
                <button className="redeem-success__btn-close" onClick={onClose}>
                    Tutup
                </button>
            </motion.div>
        </div>
    );
}

// ── RedeemModal ───────────────────────────────────────────────────────────────
export default function RedeemModal({ open, onClose, onSuccess }: Props) {
    const { refreshUser } = useAuth();
    const [code, setCode]       = useState('');
    const [loading, setLoading] = useState(false);
    const [reward, setReward]   = useState<Reward | null>(null);
    const [error, setError]     = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setCode('');
            setReward(null);
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setReward(null);
        setError(null);
        try {
            const res = await fetch('/auth/redeem', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.message ?? 'Kode tidak valid.');
            } else {
                const r: Reward = data?.reward ?? { cash: 0, tr: 0, items: [], summary: '' };
                setReward(r);
                setCode('');
                refreshUser();
                if (onSuccess) onSuccess(r);
            }
        } catch {
            setError('Tidak dapat terhubung ke server. Coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemAgain = () => {
        setReward(null);
        setError(null);
        setTimeout(() => inputRef.current?.focus(), 80);
    };

    return (
        <AnimatePresence>
        {open && (
            <>
            <motion.div
                className="redeem-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={onClose}
            />

            <motion.div
                className="redeem-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Redeem Kode"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
            >
                <AnimatePresence mode="wait">
                {reward ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <SuccessScreen
                            reward={reward}
                            onClose={onClose}
                            onRedeemAgain={handleRedeemAgain}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {/* Header */}
                        <div className="redeem-modal__header">
                            <span className="redeem-modal__icon"><IoGiftOutline size={20} /></span>
                            <h2 className="redeem-modal__title">Redeem Kode</h2>
                            <button className="redeem-modal__close" onClick={onClose} aria-label="Tutup">
                                <IoCloseOutline size={20} />
                            </button>
                        </div>

                        <p className="redeem-modal__desc">
                            Masukkan kode hadiah yang kamu punya. Kode bersifat case-insensitive.
                        </p>

                        {/* Error */}
                        <AnimatePresence>
                        {error && (
                            <motion.div
                                className="redeem-modal__feedback redeem-modal__feedback--error"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <IoAlertCircleOutline size={16} />
                                {error}
                            </motion.div>
                        )}
                        </AnimatePresence>

                        {/* Form */}
                        <form className="redeem-modal__form" onSubmit={handleSubmit} noValidate>
                            <input
                                ref={inputRef}
                                className="redeem-modal__input"
                                type="text"
                                placeholder="Contoh: HEROINDONESIA2026"
                                value={code}
                                onChange={e => {
                                    setCode(e.target.value);
                                    if (error) setError(null);
                                }}
                                maxLength={50}
                                autoComplete="off"
                                spellCheck={false}
                                disabled={loading}
                            />
                            <button
                                className="redeem-modal__btn"
                                type="submit"
                                disabled={loading || !code.trim()}
                            >
                                {loading ? 'Menukarkan...' : 'Tukar'}
                            </button>
                        </form>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
            </>
        )}
        </AnimatePresence>
    );
}
