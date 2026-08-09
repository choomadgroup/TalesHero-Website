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
const ACCOUNT_INFO_API = '/auth/account-info';

type EmailType = 'password' | 'security' | 'account';

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

        const value = identifier.trim();
        if (!value) {
            setError('Username game atau email wajib diisi.');
            return;
        }
        if (type === 'account' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setError('Untuk menemukan akun, masukkan email yang digunakan saat mendaftar.');
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
                type === 'account'
                    ? ACCOUNT_INFO_API
                    : type === 'password' ? FORGOT_PASSWORD_EMAIL_API : FORGOT_SECURITY_EMAIL_API,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                        type === 'account'
                            ? { email: value, captcha }
                            : { identifier: value, captcha },
                    ),
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

    const readyToSend = identifier.trim().length > 0;

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
                                        : emailSent === 'security'
                                            ? 'Jawaban pertanyaan keamanan'
                                            : 'Informasi akun dan link reset kata sandi'}{' '}
                                    sudah dikirim ke{' '}
                                    <strong>{maskedEmail || 'email yang terdaftar di akunmu'}</strong>.
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
                                    Masukkan username game atau email terdaftar.
                                     Email pemulihan akan dikirim otomatis ke email yang tersimpan di akunmu.
                                     Untuk menemukan Game ID dan detail akun, gunakan email terdaftar.
                                </p>

                                {error && <div className="login-api-error">{error}</div>}

                                <div className="daftar-field">
                                    <label className="daftar-field__label" htmlFor="recovery-identifier">
                                        Username Game atau Email
                                    </label>
                                    <div className="daftar-field__input-wrap">
                                        {identifier.includes('@')
                                            ? <IoMailOutline className="daftar-field__icon" />
                                            : <IoPersonOutline className="daftar-field__icon" />
                                        }
                                        <input
                                            id="recovery-identifier"
                                            type="text"
                                            className="daftar-field__input"
                                            placeholder="Username game atau email terdaftar"
                                            value={identifier}
                                            onChange={event => {
                                                setIdentifier(event.target.value);
                                                if (error) setError('');
                                            }}
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>

                                {readyToSend && (
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
                                            <button
                                                type="button"
                                                className="reset-recovery-btn reset-recovery-btn--account"
                                                disabled={loading !== null}
                                                onClick={() => sendRecoveryEmail('account')}
                                            >
                                                <IoPersonOutline size={17} />
                                                {loading === 'account' ? 'Mencari...' : 'Temukan Akun via Email'}
                                            </button>
                                        </div>

                                        <p className="reset-recovery-note">
                                            Email dikirim ke alamat yang didaftarkan saat membuat akun.
                                            Kamu tidak perlu memasukkan email secara manual.
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
