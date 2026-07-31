import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoGiftOutline, IoCloseOutline, IoCheckmarkCircle, IoAlertCircleOutline } from 'react-icons/io5';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess?: (reward: { type: string; amount: number; label: string }) => void;
}

export default function RedeemModal({ open, onClose, onSuccess }: Props) {
    const [code, setCode]       = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError]     = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (open) {
            setCode('');
            setSuccess(null);
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [open]);

    // Close on Escape
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
        setSuccess(null);
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
                setSuccess(data?.message ?? 'Kode berhasil ditukarkan!');
                setCode('');
                if (data?.reward && onSuccess) onSuccess(data.reward);
            }
        } catch {
            setError('Tidak dapat terhubung ke server. Coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
        {open && (
            <>
            {/* Backdrop */}
            <motion.div
                className="redeem-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                className="redeem-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Redeem Kode"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
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

                {/* Success */}
                <AnimatePresence>
                {success && (
                    <motion.div
                        className="redeem-modal__feedback redeem-modal__feedback--success"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        <IoCheckmarkCircle size={16} />
                        {success}
                    </motion.div>
                )}
                </AnimatePresence>

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
                            if (success) setSuccess(null);
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
            </>
        )}
        </AnimatePresence>
    );
}
