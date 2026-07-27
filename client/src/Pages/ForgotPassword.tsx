import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import TurnstileWidget from '@/Components/TurnstileWidget';
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

type EmailType = 'password' | 'security';

export default function ForgotPassword() {
    usePageMeta({
        title: 'Pemulihan Akun — Tales Hero Indonesia',
        description: 'Kirim link reset kata sandi atau pertanyaan keamanan Tales Hero Indonesia ke email terdaftar.',
    });

    const [, setLocation] = useLocation();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState<EmailType | null>(null);
    const [loading, setLoading] = useState<EmailType | null>(null);
    const [error, setError] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [sendCount, setSendCount] = useState(0);
    const [nextAllowedAt, setNextAllowedAt] = useState<number | null>(null);
    const [countdown, setCountdown] = useState('');
    const [captcha, setCaptcha] = useState('');
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

        const usernameValue = username.trim();
        const emailValue = email.trim().toLowerCase();
        if (!usernameValue || !emailValue) {
            setError('Username game dan email wajib diisi.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            setError('Format email tidak valid.');
            return;
        }
        if (!captcha) {
            setError('Harap selesaikan verifikasi keamanan terlebih dahulu.');
            return;
        }
        setLoading(type);
        setError('');
        try {
            const response = await fetch(
                type === 'password' ? FORGOT_PASSWORD_EMAIL_API : FORGOT_SECURITY_EMAIL_API,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: usernameValue, email: emailValue, captcha }),
                },
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data?.message ?? 'Email pemulihan gagal dikirim. Coba lagi nanti.');
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

            setEmailSent(type);
        } catch {
            setError('Tidak dapat terhubung ke server.');
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
                                    Masukkan username game dan email yang sudah terdaftar.
                                </p>

                                {error && <div className="login-api-error">{error}</div>}

                                <div className="daftar-field">
                                    <label className="daftar-field__label" htmlFor="recovery-username">
                                        Username Game
                                    </label>
                                    <div className="daftar-field__input-wrap">
                                        <IoPersonOutline className="daftar-field__icon" />
                                        <input
                                            id="recovery-username"
                                            type="text"
                                            className="daftar-field__input"
                                            placeholder="Masukkan username game"
                                            value={username}
                                            onChange={event => {
                                                setUsername(event.target.value);
                                                if (error) setError('');
                                            }}
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                <div className="daftar-field">
                                    <label className="daftar-field__label" htmlFor="recovery-email">
                                        Email Terdaftar
                                    </label>
                                    <div className="daftar-field__input-wrap">
                                        <IoMailOutline className="daftar-field__icon" />
                                        <input
                                            id="recovery-email"
                                            type="email"
                                            className="daftar-field__input"
                                            placeholder="Masukkan email saat pendaftaran"
                                            value={email}
                                            onChange={event => {
                                                setEmail(event.target.value);
                                                if (error) setError('');
                                            }}
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {username.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                                    <>
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
                                <TurnstileWidget onToken={setCaptcha} />
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}