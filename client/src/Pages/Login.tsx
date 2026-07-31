import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import FormSkeleton from '@/Components/FormSkeleton';
import { usePageMeta } from '@/Hooks/use-page-meta';
import { useAuth } from '@/Hooks/use-auth';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import TurnstileWidget from '@/Components/TurnstileWidget';
import {
    IoEye, IoEyeOff, IoPersonOutline, IoLockClosedOutline,
} from 'react-icons/io5';

const LOGIN_API = '/auth/login';

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
    api?:      string;
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

    const { login } = useAuth();
    const [, setLocation] = useLocation();

    const [form, setForm]     = useState<FormData>({ username: '', password: '' });
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading]   = useState(false);
    const [captcha, setCaptcha]   = useState('');

    const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(err => ({ ...err, [key]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate(form);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        if (!captcha) {
            setErrors({ api: 'Harap selesaikan verifikasi keamanan terlebih dahulu.' });
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            const res = await fetch(LOGIN_API, {
                method:  'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: form.username.trim(),
                        password: form.password,
                        captcha,
                    }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors({ api: data?.message ?? 'Username/email atau kata sandi salah.' });
            } else {
                const data = await res.json().catch(() => ({}));
                login({
                    username:    data.user?.username    ?? form.username.trim(),
                    nickname:    data.user?.nickname    ?? data.user?.username ?? form.username.trim(),
                    gameId:      data.user?.gameId      ?? null,
                    cash:        data.user?.cash        ?? 0,
                    mau:         data.user?.mau         ?? 0,
                    tr:          data.user?.tr          ?? 0,
                    email:       data.user?.email       ?? '',
                    secQuestion: data.user?.secQuestion ?? '',
                });
                setLocation('/akun');
            }
        } catch {
            setErrors({ api: 'Tidak dapat terhubung ke server.' });
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
                <div className="login-form-wrap">
                    <AnimatePresence mode="wait">
                    {loading ? (
                        <FormSkeleton rows={2} label="Sedang masuk..." />
                    ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <h1 className="login-form-wrap__title">Masuk ke Akunmu</h1>
                    <p className="login-form-wrap__sub">Selamat datang kembali, Hero!</p>

                    {errors.api && (
                        <div className="login-api-error">{errors.api}</div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit} noValidate>

                        {/* Username / Email */}
                        <div className={`daftar-field${errors.username ? ' daftar-field--error' : ''}`}>
                            <label className="daftar-field__label">Username</label>
                            <div className="daftar-field__input-wrap">
                                <IoPersonOutline className="daftar-field__icon" />
                                <input
                                    type="text"
                                    className="daftar-field__input"
                                    placeholder="Username"
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
                                    placeholder="Kata Sandi"
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

                        {/* Account recovery */}
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
                        <TurnstileWidget onToken={setCaptcha} />
                        <button type="submit" className="daftar-submit login-submit" disabled={loading}>
                            Masuk Sekarang
                        </button>

                    </form>

                    <p className="daftar-login-hint">
                        Belum punya akun game?{' '}
                        <button className="daftar-login-hint__link" onClick={() => setLocation('/daftar')}>
                            Daftar di sini
                        </button>
                    </p>
                    </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
        <Footer />
        </>
    );
}
