import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import ReCAPTCHA from 'react-google-recaptcha';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    IoHome, IoEye, IoEyeOff, IoCheckmarkCircle,
    IoPersonOutline, IoMailOutline, IoLockClosedOutline,
    IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { GiCrossedSwords } from 'react-icons/gi';

// ── Ganti dengan endpoint API game kamu ───────────────────────
const REGISTER_API = 'https://api.taleshero.web.id/auth/register';
const RECAPTCHA_SITE_KEY = '6LeK3mEtAAAAAN5u4fTLNlfuUgwlPPB2dxcw3orE';
// ─────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 4.9) % 100}%`,
    top:  `${(i * 6.7) % 90}%`,
    delay:    `${(i * 0.28) % 3}s`,
    duration: `${1.8 + (i % 4) * 0.6}s`,
    size: `${4 + (i % 5)}px`,
}));

const SECURITY_QUESTIONS = [
    'Nama hewan kesayangan kamu?',
    'Warna apa yang kamu suka?',
    'Apa nama panggilan kamu?',
];

interface FormData {
    username:   string;
    email:      string;
    password:   string;
    confirm:    string;
    secQuestion: string;
    secAnswer:  string;
}
interface FormErrors {
    username?:   string;
    email?:      string;
    password?:   string;
    confirm?:    string;
    secQuestion?: string;
    secAnswer?:  string;
    captcha?:    string;
    api?:        string;
}

function validate(data: FormData, captchaToken: string | null): FormErrors {
    const errors: FormErrors = {};

    if (!data.username.trim())
        errors.username = 'Username wajib diisi.';
    else if (data.username.trim().length < 3)
        errors.username = 'Username minimal 3 karakter.';
    else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim()))
        errors.username = 'Username hanya boleh huruf, angka, dan underscore.';

    if (!data.email.trim())
        errors.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
        errors.email = 'Format email tidak valid.';

    if (!data.password)
        errors.password = 'Kata sandi wajib diisi.';
    else if (data.password.length < 8)
        errors.password = 'Kata sandi minimal 8 karakter.';

    if (!data.confirm)
        errors.confirm = 'Konfirmasi kata sandi wajib diisi.';
    else if (data.confirm !== data.password)
        errors.confirm = 'Kata sandi tidak cocok.';

    if (!data.secQuestion)
        errors.secQuestion = 'Pilih pertanyaan keamanan.';

    if (!data.secAnswer.trim())
        errors.secAnswer = 'Jawaban pertanyaan keamanan wajib diisi.';

    if (!captchaToken)
        errors.captcha = 'Harap selesaikan verifikasi CAPTCHA.';

    return errors;
}

export default function Daftar() {
    usePageMeta({
        title: 'Daftar — Tales Hero Indonesia',
        description: 'Daftarkan hero-mu dan bergabunglah dengan komunitas Tales Hero Indonesia. Gratis!',
    });

    const [, setLocation] = useLocation();
    const captchaRef = useRef<ReCAPTCHA>(null);

    const [form, setForm]             = useState<FormData>({ username: '', email: '', password: '', confirm: '', secQuestion: '', secAnswer: '' });
    const [errors, setErrors]         = useState<FormErrors>({});
    const [showPass, setShowPass]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [loading, setLoading]       = useState(false);
    const [success, setSuccess]       = useState(false);

    const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(err => ({ ...err, [key]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate(form, captchaToken);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setLoading(true);
        setErrors({});

        try {
            const res = await fetch(REGISTER_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username:     form.username.trim(),
                    email:        form.email.trim(),
                    password:     form.password,
                    secQuestion:  form.secQuestion,
                    secAnswer:    form.secAnswer.trim(),
                    captcha:      captchaToken,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors({ api: data?.message ?? 'Pendaftaran gagal. Coba lagi nanti.' });
                captchaRef.current?.reset();
                setCaptchaToken(null);
            } else {
                setSuccess(true);
            }
        } catch {
            setErrors({ api: 'Tidak dapat terhubung ke server. Periksa koneksi internet kamu.' });
            captchaRef.current?.reset();
            setCaptchaToken(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <Header />
        <div className="cs-page cs-page--daftar">
            {/* Stars bg */}
            <div className="cs-page__bg">
                {STARS.map(s => (
                    <span key={s.id} className="cs-page__star cs-page__star--pink" style={{
                        left: s.left, top: s.top,
                        width: s.size, height: s.size,
                        animationDelay: s.delay,
                        animationDuration: s.duration,
                    }} />
                ))}
            </div>

            <motion.div
                className="cs-page__card daftar-form-card"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
            >

                <AnimatePresence mode="wait">
                    {success ? (
                        /* ── Sukses ── */
                        <motion.div
                            key="success"
                            className="daftar-success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <IoCheckmarkCircle className="daftar-success__icon" />
                            <h2 className="daftar-success__title">Pendaftaran Berhasil!</h2>
                            <p className="daftar-success__desc">
                                Selamat datang, <strong>{form.username}</strong>!<br />
                                Akun kamu telah dibuat. Silakan cek email untuk verifikasi.
                            </p>
                            <button className="cs-page__btn cs-page__btn--pink" onClick={() => setLocation('/login')}>
                                <GiCrossedSwords size={16} /> Masuk Sekarang
                            </button>
                            <button className="daftar-success__home" onClick={() => setLocation('/')}>
                                <IoHome size={14} /> Kembali ke Beranda
                            </button>
                        </motion.div>
                    ) : (
                        /* ── Form ── */
                        <motion.div key="form" className="daftar-form-wrap">
                            <h1 className="daftar-form-wrap__title">Buat Akun Baru</h1>
                            <p className="daftar-form-wrap__sub">Bergabunglah dan jadilah hero legendaris!</p>

                            {errors.api && (
                                <div className="daftar-api-error">{errors.api}</div>
                            )}

                            <form className="daftar-form" onSubmit={handleSubmit} noValidate>

                                {/* Username */}
                                <div className={`daftar-field${errors.username ? ' daftar-field--error' : ''}`}>
                                    <label className="daftar-field__label">Username</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoPersonOutline className="daftar-field__icon" />
                                        <input
                                            type="text"
                                            className="daftar-field__input"
                                            placeholder="contoh: HeroKu123"
                                            value={form.username}
                                            onChange={set('username')}
                                            autoComplete="username"
                                            maxLength={24}
                                        />
                                    </div>
                                    {errors.username && <p className="daftar-field__error">{errors.username}</p>}
                                </div>

                                {/* Email */}
                                <div className={`daftar-field${errors.email ? ' daftar-field--error' : ''}`}>
                                    <label className="daftar-field__label">Email</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoMailOutline className="daftar-field__icon" />
                                        <input
                                            type="email"
                                            className="daftar-field__input"
                                            placeholder="email@kamu.com"
                                            value={form.email}
                                            onChange={set('email')}
                                            autoComplete="email"
                                        />
                                    </div>
                                    {errors.email && <p className="daftar-field__error">{errors.email}</p>}
                                </div>

                                {/* Password */}
                                <div className={`daftar-field${errors.password ? ' daftar-field--error' : ''}`}>
                                    <label className="daftar-field__label">Kata Sandi</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoLockClosedOutline className="daftar-field__icon" />
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            className="daftar-field__input"
                                            placeholder="Minimal 8 karakter"
                                            value={form.password}
                                            onChange={set('password')}
                                            autoComplete="new-password"
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

                                {/* Confirm Password */}
                                <div className={`daftar-field${errors.confirm ? ' daftar-field--error' : ''}`}>
                                    <label className="daftar-field__label">Ulangi Kata Sandi</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoLockClosedOutline className="daftar-field__icon" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            className="daftar-field__input"
                                            placeholder="Ketik ulang kata sandi"
                                            value={form.confirm}
                                            onChange={set('confirm')}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="daftar-field__eye"
                                            onClick={() => setShowConfirm(v => !v)}
                                            aria-label={showConfirm ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                                        >
                                            {showConfirm ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirm && <p className="daftar-field__error">{errors.confirm}</p>}
                                </div>

                                {/* Pertanyaan Keamanan */}
                                <div className="daftar-security-divider">
                                    <IoShieldCheckmarkOutline size={14} />
                                    <span>Pertanyaan Keamanan</span>
                                    <small>Digunakan untuk memulihkan akun jika lupa sandi atau email</small>
                                </div>

                                <div className={`daftar-field${errors.secQuestion ? ' daftar-field--error' : ''}`}>
                                    <label className="daftar-field__label">Pilih Pertanyaan</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoShieldCheckmarkOutline className="daftar-field__icon" />
                                        <select
                                            className="daftar-field__input daftar-field__select"
                                            value={form.secQuestion}
                                            onChange={e => {
                                                setForm(f => ({ ...f, secQuestion: e.target.value }));
                                                if (errors.secQuestion) setErrors(err => ({ ...err, secQuestion: undefined }));
                                            }}
                                        >
                                            <option value="">— Pilih pertanyaan —</option>
                                            {SECURITY_QUESTIONS.map(q => (
                                                <option key={q} value={q}>{q}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.secQuestion && <p className="daftar-field__error">{errors.secQuestion}</p>}
                                </div>

                                <div className={`daftar-field${errors.secAnswer ? ' daftar-field--error' : ''}`}>
                                    <label className="daftar-field__label">Jawaban</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoShieldCheckmarkOutline className="daftar-field__icon" />
                                        <input
                                            type="text"
                                            className="daftar-field__input"
                                            placeholder="Ketik jawabanmu"
                                            value={form.secAnswer}
                                            onChange={e => {
                                                setForm(f => ({ ...f, secAnswer: e.target.value }));
                                                if (errors.secAnswer) setErrors(err => ({ ...err, secAnswer: undefined }));
                                            }}
                                            autoComplete="off"
                                            maxLength={64}
                                        />
                                    </div>
                                    {errors.secAnswer && <p className="daftar-field__error">{errors.secAnswer}</p>}
                                </div>

                                {/* reCAPTCHA */}
                                <div className="daftar-captcha">
                                    <ReCAPTCHA
                                        ref={captchaRef}
                                        sitekey={RECAPTCHA_SITE_KEY}
                                        onChange={token => {
                                            setCaptchaToken(token);
                                            if (errors.captcha) setErrors(e => ({ ...e, captcha: undefined }));
                                        }}
                                        onExpired={() => setCaptchaToken(null)}
                                    />
                                    {errors.captcha && <p className="daftar-field__error">{errors.captcha}</p>}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="daftar-submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="daftar-submit__spinner" />
                                    ) : (
                                        <><GiCrossedSwords size={16} /> Daftar Sekarang</>
                                    )}
                                </button>

                            </form>

                            <p className="daftar-login-hint">
                                Sudah punya akun?{' '}
                                <button className="daftar-login-hint__link" onClick={() => setLocation('/login')}>
                                    Masuk di sini
                                </button>
                            </p>

                            <button className="daftar-back" onClick={() => setLocation('/')}>
                                <IoHome size={14} /> Kembali ke Beranda
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
        <Footer />
        </>
    );
}
