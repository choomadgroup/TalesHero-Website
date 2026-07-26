import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    IoArrowBack, IoCheckmarkCircle, IoEye, IoEyeOff,
    IoKeyOutline, IoLockClosedOutline, IoPersonOutline,
    IoShieldCheckmarkOutline,
} from 'react-icons/io5';

const QUESTION_API              = '/auth/security-question';
const RESET_API                 = '/auth/reset-password';
const FORGOT_PASSWORD_EMAIL_API = '/auth/forgot-password';
const FORGOT_SECURITY_EMAIL_API = '/auth/forgot-security-question';

interface ResetErrors {
    identifier?: string;
    answer?: string;
    newPassword?: string;
    confirm?: string;
    api?: string;
}

export default function ForgotPassword() {
    usePageMeta({
        title: 'Reset Kata Sandi — Tales Hero Indonesia',
        description: 'Atur ulang kata sandi akun Tales Hero Indonesia menggunakan pertanyaan keamanan.',
    });

    const [, setLocation] = useLocation();
    const [identifier, setIdentifier] = useState('');
    const [account, setAccount] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'lookup' | 'reset' | 'success'>('lookup');
    const [errors, setErrors] = useState<ResetErrors>({});
    const [emailSent, setEmailSent] = useState<'password' | 'security' | null>(null);
    const [emailIdentifier, setEmailIdentifier] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    const lookupQuestion = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!identifier.trim()) {
            setErrors({ identifier: 'Username atau email wajib diisi.' });
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            const response = await fetch(QUESTION_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: identifier.trim(), email: identifier.trim() }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setErrors({ api: data?.message ?? 'Pertanyaan keamanan tidak ditemukan.' });
                return;
            }
            setAccount(data.username);
            setQuestion(data.secQuestion);
            setStep('reset');
        } catch {
            setErrors({ api: 'Tidak dapat terhubung ke server.' });
        } finally {
            setLoading(false);
        }
    };

    const sendEmailReset = async (type: 'password' | 'security') => {
        if (!emailIdentifier.trim()) return;
        setEmailLoading(true);
        try {
            const api = type === 'password' ? FORGOT_PASSWORD_EMAIL_API : FORGOT_SECURITY_EMAIL_API;
            await fetch(api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: emailIdentifier.trim() }),
            });
            setEmailSent(type);
        } catch {
            // tetap tampilkan pesan sukses agar tidak bisa digunakan mendeteksi akun
            setEmailSent(type);
        } finally {
            setEmailLoading(false);
        }
    };

    const resetPassword = async (event: React.FormEvent) => {
        event.preventDefault();
        const nextErrors: ResetErrors = {};
        if (!answer.trim()) nextErrors.answer = 'Jawaban pertanyaan keamanan wajib diisi.';
        if (newPassword.length < 8) nextErrors.newPassword = 'Kata sandi baru minimal 8 karakter.';
        if (newPassword !== confirm) nextErrors.confirm = 'Konfirmasi kata sandi tidak cocok.';
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            const response = await fetch(RESET_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: account, secAnswer: answer, newPassword }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setErrors({ api: data?.message ?? 'Kata sandi gagal diatur ulang.' });
                return;
            }
            setStep('success');
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
                <div className="cs-page__bg" />
                <motion.div
                    className="cs-page__card login-form-card"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                    <div className="login-form-wrap reset-form-wrap">
                        {emailSent ? (
                            <div className="reset-success">
                                <IoCheckmarkCircle size={54} />
                                <h1 className="login-form-wrap__title">Email Terkirim!</h1>
                                <p className="login-form-wrap__sub">
                                    Jika email kamu terdaftar, link {emailSent === 'password' ? 'reset kata sandi' : 'reset pertanyaan keamanan'} sudah dikirim.<br />
                                    Periksa kotak masuk atau folder spam kamu.
                                </p>
                                <button className="daftar-submit" onClick={() => setLocation('/login')}>
                                    Kembali ke Login
                                </button>
                                <button type="button" className="reset-secondary" onClick={() => { setEmailSent(null); setEmailIdentifier(''); }}>
                                    Coba lagi
                                </button>
                            </div>
                        ) : step === 'success' ? (
                            <div className="reset-success">
                                <IoCheckmarkCircle size={54} />
                                <h1 className="login-form-wrap__title">Kata Sandi Berhasil Diubah</h1>
                                <p className="login-form-wrap__sub">
                                    Silakan masuk menggunakan kata sandi baru kamu.
                                </p>
                                <button className="daftar-submit" onClick={() => setLocation('/login')}>
                                    Masuk Sekarang
                                </button>
                            </div>
                        ) : (
                            <>
                                <button className="reset-back" onClick={() => setLocation('/login')}>
                                    <IoArrowBack size={15} /> Kembali ke Login
                                </button>
                                <div className="reset-heading-icon">
                                    {step === 'lookup' ? <IoKeyOutline size={26} /> : <IoShieldCheckmarkOutline size={26} />}
                                </div>
                                <h1 className="login-form-wrap__title">
                                    {step === 'lookup' ? 'Lupa Kata Sandi?' : 'Jawab Pertanyaan Keamanan'}
                                </h1>
                                <p className="login-form-wrap__sub">
                                    {step === 'lookup'
                                        ? 'Temukan akunmu untuk melanjutkan reset kata sandi.'
                                        : 'Masukkan jawaban yang kamu buat saat mengatur akun.'}
                                </p>
                                {errors.api && <div className="login-api-error">{errors.api}</div>}

                                {step === 'lookup' ? (
                                    <form className="login-form" onSubmit={lookupQuestion} noValidate>
                                        <div className={`daftar-field${errors.identifier ? ' daftar-field--error' : ''}`}>
                                            <label className="daftar-field__label">Username atau Email</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoPersonOutline className="daftar-field__icon" />
                                                <input
                                                    type="text"
                                                    className="daftar-field__input"
                                                    placeholder="Username atau email"
                                                    value={identifier}
                                                    onChange={event => setIdentifier(event.target.value)}
                                                    autoComplete="username"
                                                />
                                            </div>
                                            {errors.identifier && <p className="daftar-field__error">{errors.identifier}</p>}
                                        </div>
                                        <button className="daftar-submit" type="submit" disabled={loading}>
                                            {loading ? 'Mencari...' : 'Lanjutkan'}
                                        </button>

                                        {/* ── Alternatif via Email ── */}
                                        <div className="reset-email-divider">
                                            <span>atau reset via email</span>
                                        </div>
                                        <div className="daftar-field">
                                            <div className="daftar-field__input-wrap">
                                                <IoPersonOutline className="daftar-field__icon" />
                                                <input
                                                    type="text"
                                                    className="daftar-field__input"
                                                    placeholder="Username atau email untuk link reset"
                                                    value={emailIdentifier}
                                                    onChange={e => setEmailIdentifier(e.target.value)}
                                                    autoComplete="username"
                                                />
                                            </div>
                                        </div>
                                        <div className="reset-email-actions">
                                            <button
                                                type="button"
                                                className="reset-email-btn"
                                                disabled={emailLoading || !emailIdentifier.trim()}
                                                onClick={() => sendEmailReset('password')}
                                            >
                                                {emailLoading ? 'Mengirim...' : '✉ Kirim Link Reset Kata Sandi'}
                                            </button>
                                            <button
                                                type="button"
                                                className="reset-email-btn reset-email-btn--secondary"
                                                disabled={emailLoading || !emailIdentifier.trim()}
                                                onClick={() => sendEmailReset('security')}
                                            >
                                                {emailLoading ? 'Mengirim...' : '🛡 Kirim Link Reset Pertanyaan Keamanan'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form className="login-form" onSubmit={resetPassword} noValidate>
                                        <div className="reset-account-chip">
                                            <span>Akun</span>
                                            <strong>{account}</strong>
                                        </div>
                                        <div className="daftar-field">
                                            <label className="daftar-field__label">Pertanyaan Keamanan</label>
                                            <div className="reset-question-box">
                                                <IoShieldCheckmarkOutline size={17} />
                                                <span>{question}</span>
                                            </div>
                                        </div>
                                        <div className={`daftar-field${errors.answer ? ' daftar-field--error' : ''}`}>
                                            <label className="daftar-field__label">Jawaban Kamu</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoShieldCheckmarkOutline className="daftar-field__icon" />
                                                <input
                                                    type="text"
                                                    className="daftar-field__input"
                                                    placeholder="Masukkan jawaban"
                                                    value={answer}
                                                    onChange={event => setAnswer(event.target.value)}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            {errors.answer && <p className="daftar-field__error">{errors.answer}</p>}
                                        </div>
                                        <div className={`daftar-field${errors.newPassword ? ' daftar-field--error' : ''}`}>
                                            <label className="daftar-field__label">Kata Sandi Baru</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoLockClosedOutline className="daftar-field__icon" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="daftar-field__input"
                                                    placeholder="Minimal 8 karakter"
                                                    value={newPassword}
                                                    onChange={event => setNewPassword(event.target.value)}
                                                    autoComplete="new-password"
                                                />
                                                <button type="button" className="daftar-field__eye" onClick={() => setShowPassword(show => !show)}>
                                                    {showPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                                </button>
                                            </div>
                                            {errors.newPassword && <p className="daftar-field__error">{errors.newPassword}</p>}
                                        </div>
                                        <div className={`daftar-field${errors.confirm ? ' daftar-field--error' : ''}`}>
                                            <label className="daftar-field__label">Ulangi Kata Sandi Baru</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoLockClosedOutline className="daftar-field__icon" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="daftar-field__input"
                                                    placeholder="Ketik ulang kata sandi"
                                                    value={confirm}
                                                    onChange={event => setConfirm(event.target.value)}
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            {errors.confirm && <p className="daftar-field__error">{errors.confirm}</p>}
                                        </div>
                                        <button className="daftar-submit" type="submit" disabled={loading}>
                                            {loading ? 'Menyimpan...' : 'Atur Ulang Kata Sandi'}
                                        </button>
                                        <button type="button" className="reset-secondary" onClick={() => { setStep('lookup'); setErrors({}); }}>
                                            Gunakan akun lain
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}