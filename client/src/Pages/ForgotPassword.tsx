import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import ReCAPTCHA from 'react-google-recaptcha';
import {
    IoArrowBack,
    IoCheckmarkCircle,
    IoKeyOutline,
    IoMailOutline,
    IoPersonOutline,
    IoShieldCheckmarkOutline,
} from 'react-icons/io5';

const FORGOT_PASSWORD_EMAIL_API = '/auth/forgot-password';
const FORGOT_SECURITY_EMAIL_API = '/auth/forgot-security-question';
const RECAPTCHA_SITE_KEY = '6LeK3mEtAAAAAN5u4fTLNlfuUgwlPPB2dxcw3orE';
const IS_DEV = import.meta.env.DEV;

type EmailType = 'password' | 'security';

export default function ForgotPassword() {
    usePageMeta({
        title: 'Pemulihan Akun — Tales Hero Indonesia',
        description: 'Kirim link reset kata sandi atau pertanyaan keamanan Tales Hero Indonesia ke email terdaftar.',
    });

    const [, setLocation] = useLocation();
    const [identifier, setIdentifier] = useState('');
    const [emailSent, setEmailSent] = useState<EmailType | null>(null);
    const [loading, setLoading] = useState<EmailType | null>(null);
    const [error, setError] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [sendCount, setSendCount] = useState(0);
    const [nextAllowedAt, setNextAllowedAt] = useState<number | null>(null);
    const [countdown, setCountdown] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaErrorMessage, setCaptchaErrorMessage] = useState('');
    const captchaRef = useRef<ReCAPTCHA>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!nextAllowedAt) { setCountdown(''); return; }
        const tick = () => {
            const remaining = nextAllowedAt - Date.now();
            if (remaining <= 0) {
                setNextAllowedAt(null);
                setCountdown('');
                if (timerRef.current) clearInterval(timerRef.current);
            } else {
                const m = Math.floor(remaining / 60000);
                const s = Math.floor((remaining % 60000) / 1000);
                setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [nextAllowedAt]);

    const sendRecoveryEmail = async (type: EmailType) => {
        if (nextAllowedAt && nextAllowedAt > Date.now()) return;

        const value = identifier.trim();
        if (!value) {
            setError('Username atau email wajib diisi.');
            return;
        }
        if (!IS_DEV && !captchaToken) {
            setCaptchaErrorMessage('Harap selesaikan verifikasi CAPTCHA.');
            return;
        }

        setLoading(type);
        setError('');
        setCaptchaErrorMessage('');
        try {
            const response = await fetch(
                type === 'password' ? FORGOT_PASSWORD_EMAIL_API : FORGOT_SECURITY_EMAIL_API,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: value, captcha: captchaToken }),
                },
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data?.message ?? 'Email pemulihan gagal dikirim. Coba lagi nanti.');
                captchaRef.current?.reset();
                setCaptchaToken(null);
                return;
            }

            const newCount = sendCount + 1;
            setSendCount(newCount);
            setMaskedEmail(data.maskedEmail ?? '');

            // Cooldown: bebas 2x, lalu 30 menit, lalu 1 jam per kirim berikutnya
            if (newCount === 2) {
                setNextAllowedAt(Date.now() + 30 * 60 * 1000);
            } else if (newCount >= 3) {
                setNextAllowedAt(Date.now() + 60 * 60 * 1000);
            }

            captchaRef.current?.reset();
            setCaptchaToken(null);
            setEmailSent(type);
        } catch {
            setError('Tidak dapat terhubung ke server.');
            captchaRef.current?.reset();
            setCaptchaToken(null);
        } finally {
            setLoading(null);
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
                                    {emailSent === 'password'
                                        ? 'Link reset kata sandi'
                                        : 'Jawaban pertanyaan keamanan'}{' '}
                                    sudah dikirim ke{' '}
                                    <strong>{maskedEmail || 'email pemulihanmu'}</strong>.
                                    <br />
                                    Periksa kotak masuk atau folder spam.
                                </p>
                                <button className="daftar-submit" onClick={() => setLocation('/login')}>
                                    Kembali ke Login
                                </button>
                                <button
                                    type="button"
                                    className="reset-secondary"
                                    disabled={!!nextAllowedAt}
                                    onClick={() => setEmailSent(null)}
                                >
                                    {nextAllowedAt
                                        ? `Coba lagi (${countdown})`
                                        : 'Coba lagi'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <button className="reset-back" onClick={() => setLocation('/login')}>
                                    <IoArrowBack size={15} /> Kembali ke Login
                                </button>
                                <div className="reset-heading-icon">
                                    <IoKeyOutline size={26} />
                                </div>
                                <h1 className="login-form-wrap__title">Pemulihan Akun</h1>
                                <p className="login-form-wrap__sub">
                                    Masukkan username atau email yang sudah terdaftar.
                                </p>

                                {error && <div className="login-api-error">{error}</div>}

                                <div className="daftar-field">
                                    <label className="daftar-field__label">Username atau Email</label>
                                    <div className="daftar-field__input-wrap">
                                        <IoPersonOutline className="daftar-field__icon" />
                                        <input
                                            type="text"
                                            className="daftar-field__input"
                                            placeholder="Username atau email"
                                            value={identifier}
                                            onChange={event => {
                                                setIdentifier(event.target.value);
                                                if (error) setError('');
                                            }}
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                {/* reCAPTCHA */}
                                <div className="daftar-captcha">
                                    <ReCAPTCHA
                                        ref={captchaRef}
                                        sitekey={RECAPTCHA_SITE_KEY}
                                        onChange={token => {
                                            setCaptchaToken(token);
                                            setCaptchaErrorMessage('');
                                        }}
                                        onExpired={() => setCaptchaToken(null)}
                                    />
                                    {captchaErrorMessage && <p className="daftar-field__error">{captchaErrorMessage}</p>}
                                </div>

                                <div className="reset-recovery-actions">
                                    <button
                                        type="button"
                                        className="reset-recovery-btn"
                                        disabled={loading !== null}
                                        onClick={() => sendRecoveryEmail('password')}
                                    >
                                        <IoMailOutline size={17} />
                                        {loading === 'password' ? 'Mengirim...' : 'Kirim Link Reset Kata Sandi'}
                                    </button>
                                    <button
                                        type="button"
                                        className="reset-recovery-btn reset-recovery-btn--secondary"
                                        disabled={loading !== null}
                                        onClick={() => sendRecoveryEmail('security')}
                                    >
                                        <IoShieldCheckmarkOutline size={17} />
                                        {loading === 'security' ? 'Mengirim...' : 'Lupa Pertanyaan Keamanan?'}
                                    </button>
                                </div>

                                <p className="reset-recovery-note">
                                    Pertanyaan keamanan tidak direset atau diubah. Jika lupa, pertanyaan yang tersimpan
                                    akan dikirim ke email yang digunakan saat pendaftaran.
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}