import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    IoEye, IoEyeOff, IoPersonOutline, IoLockClosedOutline,
} from 'react-icons/io5';
import { GiCrossedSwords } from 'react-icons/gi';
import { asset } from '@/Lib/utils';

// ── Ganti dengan endpoint API game ─────────────────────────────
const LOGIN_API = 'https://api.taleshero.web.id/auth/login';
// ──────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 5.3) % 100}%`,
    top: `${(i * 7.1) % 90}%`,
    delay: `${(i * 0.35) % 3}s`,
    duration: `${2 + (i % 4) * 0.5}s`,
    size: `${4 + (i % 4)}px`,
}));

interface FormData {
    username: string;
    password: string;
}
interface FormErrors {
    username?: string;
    password?: string;
    api?: string;
}

function validate(data: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!data.username.trim())
        errors.username = 'Username atau email wajib diisi.';
    if (!data.password)
        errors.password = 'Kata sandi wajib diisi.';
    return errors;
}

export default function Login() {
    usePageMeta({
        title: 'Login — Tales Hero Indonesia',
        description: 'Masuk ke akun Tales Hero Indonesia-mu dan lanjutkan petualanganmu.',
    });

    const [, setLocation] = useLocation();
    const [form, setForm]         = useState<FormData>({ username: '', password: '' });
    const [errors, setErrors]     = useState<FormErrors>({});
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading]   = useState(false);

    const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(err => ({ ...err, [key]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        setErrors({});

        try {
            const res = await fetch(LOGIN_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username.trim(),
                    password: form.password,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors({ api: data?.message ?? 'Username/email atau kata sandi salah.' });
            } else {
                setLocation('/');
            }
        } catch {
            setErrors({ api: 'Tidak dapat terhubung ke server. Periksa koneksi internet kamu.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Header />
        <div className="cs-page cs-page--login">
            {/* Stars bg */}
            <div className="cs-page__bg">
                {STARS.map(s => (
                    <span key={s.id} className="cs-page__star" style={{
                        left: s.left, top: s.top,
                        width: s.size, height: s.size,
                        animationDelay: s.delay,
                        animationDuration: s.duration,
                    }} />
                ))}
            </div>

            <motion.div
                className="cs-page__card login-form-card"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
            >
                {/* Logo */}
                <motion.div
                    className="login-logo-wrap"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.45, ease: 'easeOut' }}
                >
                    <img
                        src={asset('/Image/tales-hero-banner.png')}
                        alt="Tales Hero Indonesia"
                        className="login-logo"
                    />
                </motion.div>

                {/* Form card */}
                <div className="login-form-wrap">
                    <h1 className="login-form-wrap__title">Masuk ke Akunmu</h1>
                    <p className="login-form-wrap__sub">Selamat datang kembali, Hero! ⚔️</p>

                    {errors.api && (
                        <div className="login-api-error">{errors.api}</div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit} noValidate>

                        {/* Username / Email */}
                        <div className={`daftar-field${errors.username ? ' daftar-field--error' : ''}`}>
                            <label className="daftar-field__label">Username atau Email</label>
                            <div className="daftar-field__input-wrap">
                                <IoPersonOutline className="daftar-field__icon" />
                                <input
                                    type="text"
                                    className="daftar-field__input"
                                    placeholder="Username atau email kamu"
                                    value={form.username}
                                    onChange={set('username')}
                                    autoComplete="username"
                                    maxLength={64}
                                />
                            </div>
                            {errors.username && <p className="daftar-field__error">{errors.username}</p>}
                        </div>

                        {/* Password */}
                        <div className={`daftar-field${errors.password ? ' daftar-field--error' : ''}`}>
                            <label className="daftar-field__label">Kata Sandi</label>
                            <div className="daftar-field__input-wrap">
                                <IoLockClosedOutline className="daftar-field__icon" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="daftar-field__input"
                                    placeholder="Kata sandi kamu"
                                    value={form.password}
                                    onChange={set('password')}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="daftar-field__eye"
                                    onClick={() => setShowPass(v => !v)}
                                    aria-label={showPass ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                                >
                                    {showPass ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p className="daftar-field__error">{errors.password}</p>}
                        </div>

                        {/* Forgot password */}
                        <div className="login-forgot">
                            <button
                                type="button"
                                className="login-forgot__link"
                                onClick={() => setLocation('/forgot-password')}
                            >
                                Lupa kata sandi?
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="daftar-submit login-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="daftar-submit__spinner" />
                            ) : (
                                <><GiCrossedSwords size={16} /> Masuk Sekarang</>
                            )}
                        </button>

                    </form>

                    <p className="daftar-login-hint">
                        Belum punya akun?{' '}
                        <button className="daftar-login-hint__link" onClick={() => setLocation('/daftar')}>
                            Daftar di sini
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
        <Footer />
        </>
    );
}
