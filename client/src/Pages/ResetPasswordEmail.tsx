import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import TurnstileWidget from '@/Components/TurnstileWidget';
import {
    IoArrowBack,
    IoCheckmarkCircle,
    IoCloseCircleOutline,
    IoEllipseOutline,
    IoEye,
    IoEyeOff,
    IoLockClosedOutline,
} from 'react-icons/io5';

const RESET_API = '/auth/email-reset-password';

export default function ResetPasswordEmail() {
    usePageMeta({
        title: 'Reset Kata Sandi — Tales Hero Indonesia',
        description: 'Atur ulang kata sandi akun Tales Hero Indonesia melalui link email.',
    });

    const [, setLocation] = useLocation();
    const [token, setToken]             = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm]         = useState('');
    const [showPass, setShowPass]       = useState(false);
    const [loading, setLoading]         = useState(false);
    const [success, setSuccess]         = useState(false);
    const [error, setError]             = useState('');
    const [captcha, setCaptcha]         = useState('');
    const passwordRules = [
        { label: 'Minimal 8 karakter', valid: newPassword.length >= 8 },
        { label: 'Mengandung huruf besar (A–Z)', valid: /[A-Z]/.test(newPassword) },
        { label: 'Mengandung huruf kecil (a–z)', valid: /[a-z]/.test(newPassword) },
        { label: 'Mengandung angka (0–9)', valid: /[0-9]/.test(newPassword) },
        { label: 'Mengandung tanda khusus (!@#$...)', valid: /[^A-Za-z0-9]/.test(newPassword) },
        { label: 'Ulangi kata sandi harus sama', valid: Boolean(confirm) && confirm === newPassword },
    ];
    const passwordStarted = Boolean(newPassword || confirm);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token') ?? '';
        if (!t) setError('Link tidak valid. Silakan minta link baru.');
        setToken(t);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            newPassword.length < 8 ||
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword) ||
            !/[^A-Za-z0-9]/.test(newPassword)
        ) {
            setError('Kata sandi belum memenuhi semua syarat.');
            return;
        }
        if (newPassword !== confirm)  { setError('Konfirmasi kata sandi tidak cocok.'); return; }
        if (!captcha) {
            setError('Harap selesaikan verifikasi keamanan terlebih dahulu.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(RESET_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword, captcha }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.message ?? 'Gagal mereset kata sandi.');
                return;
            }
            setSuccess(true);
        } catch {
            setError('Tidak dapat terhubung ke server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="cs-page cs-page--login">
                <div className="cs-page__bg" />
                <motion.div
                    className="cs-page__card login-form-card"
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                    <div className="login-form-wrap reset-form-wrap">
                        {success ? (
                            <div className="reset-success">
                                <IoCheckmarkCircle size={54} />
                                <h1 className="login-form-wrap__title">Kata Sandi Berhasil Diubah!</h1>
                                <p className="login-form-wrap__sub">Silakan masuk menggunakan kata sandi baru kamu.</p>
                                <button className="daftar-submit" onClick={() => setLocation('/login')}>
                                    Masuk Sekarang
                                </button>
                            </div>
                        ) : (
                            <>
                                <button className="reset-back" onClick={() => setLocation('/forgot-password')}>
                                    <IoArrowBack size={15} /> Kembali
                                </button>
                                <h1 className="login-form-wrap__title">Buat Kata Sandi Baru</h1>
                                <p className="login-form-wrap__sub">Masukkan kata sandi baru untuk akunmu.</p>
                                {error && <div className="login-api-error">{error}</div>}
                                {!error || token ? (
                                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                                        <div className="daftar-field">
                                            <label className="daftar-field__label">Kata Sandi Baru</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoLockClosedOutline className="daftar-field__icon" />
                                                <input
                                                    type={showPass ? 'text' : 'password'}
                                                    className="daftar-field__input"
                                                    placeholder="Minimal 8 karakter"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                />
                                                <button type="button" className="daftar-field__eye" onClick={() => setShowPass(v => !v)}>
                                                    {showPass ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="daftar-field">
                                            <label className="daftar-field__label">Ulangi Kata Sandi Baru</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoLockClosedOutline className="daftar-field__icon" />
                                                <input
                                                    type={showPass ? 'text' : 'password'}
                                                    className="daftar-field__input"
                                                    placeholder="Ketik ulang kata sandi"
                                                    value={confirm}
                                                    onChange={e => setConfirm(e.target.value)}
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>
                                        <div className="password-rules" aria-live="polite">
                                            <p className="password-rules__title">Syarat kata sandi</p>
                                            <div className="password-rules__grid">
                                                {passwordRules.map(rule => {
                                                    const state = !passwordStarted ? 'idle' : rule.valid ? 'valid' : 'invalid';
                                                    return (
                                                        <span key={rule.label} className={`password-rule password-rule--${state}`}>
                                                            {state === 'valid'
                                                                ? <IoCheckmarkCircle size={14} />
                                                                : state === 'invalid'
                                                                    ? <IoCloseCircleOutline size={14} />
                                                                    : <IoEllipseOutline size={12} />}
                                                            {rule.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <TurnstileWidget onToken={setCaptcha} />
                                        <button className="daftar-submit" type="submit" disabled={loading || !token}>
                                            {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                                        </button>
                                    </form>
                                ) : null}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}
