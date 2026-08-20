import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FormSkeleton from '@/Components/FormSkeleton';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import TurnstileWidget from '@/Components/TurnstileWidget';
import LegalConsentModal from '@/Components/LegalConsentModal';
import {
    IoHome, IoEye, IoEyeOff, IoCheckmarkCircle,
    IoPersonOutline, IoMailOutline, IoLockClosedOutline,
    IoShieldCheckmarkOutline, IoCloseCircleOutline, IoEllipseOutline,
} from 'react-icons/io5';

const REGISTER_API = '/auth/register';

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
    username?:    string;
    email?:       string;
    password?:    string;
    confirm?:     string;
    secQuestion?: string;
    secAnswer?:   string;
    consent?:     string;
    api?:         string;
}

function validate(data: FormData): FormErrors {
    const errors: FormErrors = {};

    if (!data.username.trim())
        errors.username = 'Username wajib diisi.';
    else if (data.username.trim().length < 5)
        errors.username = 'Username minimal 5 karakter.';
    else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim()))
        errors.username = 'Username hanya boleh huruf, angka, dan underscore.';

    if (!data.email.trim())
        errors.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
        errors.email = 'Format email tidak valid.';

    if (!data.password)
        errors.password = 'Kata sandi wajib diisi.';
    else if (
        data.password.length < 8 ||
        !/[A-Z]/.test(data.password) ||
        !/[a-z]/.test(data.password) ||
        !/[0-9]/.test(data.password) ||
        !/[^A-Za-z0-9]/.test(data.password)
    )
        errors.password = 'Kata sandi belum memenuhi semua syarat.';

    if (!data.confirm)
        errors.confirm = 'Konfirmasi kata sandi wajib diisi.';
    else if (data.confirm !== data.password)
        errors.confirm = 'Kata sandi tidak cocok.';

    if (!data.secQuestion)
        errors.secQuestion = 'Pilih pertanyaan keamanan.';

    if (!data.secAnswer.trim())
        errors.secAnswer = 'Jawaban pertanyaan keamanan wajib diisi.';

    return errors;
}

export default function Daftar() {
    usePageMeta({
        title: 'Daftar — Tales Hero Indonesia',
        description: 'Daftarkan akun-mu dan bergabunglah dengan komunitas Tales Hero Indonesia.',
    });

    const [, setLocation] = useLocation();

    const [form, setForm]               = useState<FormData>({ username: '', email: '', password: '', confirm: '', secQuestion: '', secAnswer: '' });
    const [errors, setErrors]           = useState<FormErrors>({});
    const [showPass, setShowPass]       = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading]         = useState(false);
    const [success, setSuccess]         = useState(false);
    const [captcha, setCaptcha]         = useState('');
    const [legalOpen, setLegalOpen]     = useState(false);
    const [legalChecked, setLegalChecked] = useState(false);
    const passwordRules = [
        { label: 'Minimal 8 karakter', valid: form.password.length >= 8 },
        { label: 'Mengandung huruf besar (A–Z)', valid: /[A-Z]/.test(form.password) },
        { label: 'Mengandung huruf kecil (a–z)', valid: /[a-z]/.test(form.password) },
        { label: 'Mengandung angka (0–9)', valid: /[0-9]/.test(form.password) },
        { label: 'Mengandung tanda khusus (!@#$...)', valid: /[^A-Za-z0-9]/.test(form.password) },
        { label: 'Ulangi kata sandi harus sama', valid: Boolean(form.confirm) && form.confirm === form.password },
    ];
    const passwordStarted = Boolean(form.password || form.confirm);

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
        if (!legalChecked) {
            setErrors({ consent: 'Kamu harus menyetujui Terms of Service dan Privacy Policy.' });
            setLegalOpen(true);
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            const res = await fetch(REGISTER_API, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username:    form.username.trim(),
                    email:       form.email.trim(),
                    password:    form.password,
                    secQuestion: form.secQuestion,
                    secAnswer:   form.secAnswer.trim(),
                    captcha,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErrors({ api: data?.message ?? 'Pendaftaran gagal. Coba lagi nanti.' });
            } else {
                setSuccess(true);
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
        <div className={`cs-page cs-page--daftar${success ? ' cs-page--centered' : ''}`}>
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
                    {loading ? (
                        <FormSkeleton key="skeleton" rows={4} label="Mendaftarkan akun..." />
                    ) : success ? (
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
                                 Link verifikasi sudah dikirim ke email <strong>{form.email}</strong>.<br />
                                 Klik link tersebut untuk mengaktifkan akun game kamu.
                            </p>
                            <button className="cs-page__btn cs-page__btn--pink" onClick={() => setLocation('/login')}>
                                 Kembali ke Login
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
                            <div className="daftar-recovery-note">
                                Demi menjaga keamanan server dan mengurangi akun palsu, syarat pendaftaran
                                kini lebih ketat. Gunakan email aktif, selesaikan verifikasi keamanan, lalu
                                klik link verifikasi yang dikirim ke email sebelum akunmu diaktifkan.
                                Email ini digunakan untuk login, reset kata sandi, dan menemukan kembali
                                pertanyaan keamanan jika kamu lupa. Satu email hanya dapat digunakan untuk satu akun.
                            </div>

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
                                            placeholder="Username"
                                            value={form.username}
                                            onChange={set('username')}
                                            autoComplete="username"
                                            maxLength={50}
                                        />
                                    </div>
                                    {errors.username && <p className="daftar-field__error">{errors.username}</p>}
                                </div>

                                {/* Email */}
                                <div className={`daftar-field${errors.email ? ' daftar-field--error' : ''}`}>
                                    <label className="daftar-field__label">Email Pemulihan</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoMailOutline className="daftar-field__icon" />
                                        <input
                                            type="email"
                                            className="daftar-field__input"
                                            placeholder="Email untuk pemulihan akun"
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
                                    <div className="password-rules" aria-live="polite">
                                        <p className="password-rules__title">Syarat kata sandi</p>
                                        <div className="password-rules__grid">
                                            {passwordRules.map(rule => {
                                                const state = !passwordStarted ? 'idle' : rule.valid ? 'valid' : 'invalid';
                                                return (
                                                    <span key={rule.label} className={`password-rule password-rule--${state}`}>
                                                        {state === 'valid' ? <IoCheckmarkCircle size={14} /> : state === 'invalid' ? <IoCloseCircleOutline size={14} /> : <IoEllipseOutline size={12} />}
                                                        {rule.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Pertanyaan Keamanan */}
                                <div className="daftar-security-divider">
                                    <IoShieldCheckmarkOutline size={14} />
                                    <span>Pertanyaan Keamanan untuk Reset Kata Sandi</span>
                                    <small>
                                        Jawaban ini tersimpan saat daftar dan digunakan untuk reset kata sandi.
                                        Email pemulihan membantu menemukan kembali pertanyaan keamanan.
                                    </small>
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

                                {/* Submit */}
                                <TurnstileWidget onToken={setCaptcha} />
                                <div className={`daftar-consent${errors.consent ? ' daftar-consent--error' : ''}`}>
                                    <input
                                        id="registration-consent"
                                        type="checkbox"
                                        className={errors.consent && !legalChecked ? 'daftar-consent__checkbox--invalid' : ''}
                                        checked={legalChecked}
                                        onChange={event => {
                                            setLegalChecked(event.target.checked);
                                            if (errors.consent) setErrors(err => ({ ...err, consent: undefined }));
                                        }}
                                    />
                                    <label htmlFor="registration-consent">
                                        Saya menyetujui{' '}
                                        <button type="button" onClick={() => setLegalOpen(true)}>Terms of Service</button>
                                        {' '}dan{' '}
                                        <button type="button" onClick={() => setLegalOpen(true)}>Privacy Policy</button>.
                                    </label>
                                </div>
                                <button type="submit" className="daftar-submit" disabled={loading}>
                                    {loading ? <span className="daftar-submit__spinner" /> : 'Daftar Sekarang'}
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
        <LegalConsentModal
            open={legalOpen}
            checked={legalChecked}
            onCheckedChange={setLegalChecked}
            onAccept={() => setLegalOpen(false)}
            onClose={() => setLegalOpen(false)}
        />
        </>
    );
}
