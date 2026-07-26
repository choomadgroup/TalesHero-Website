import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
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
    const [identifier, setIdentifier] = useState('');
    const [emailSent, setEmailSent] = useState<EmailType | null>(null);
    const [loading, setLoading] = useState<EmailType | null>(null);
    const [error, setError] = useState('');

    const sendRecoveryEmail = async (type: EmailType) => {
        const value = identifier.trim();
        if (!value) {
            setError('Username atau email wajib diisi.');
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
                    body: JSON.stringify({ identifier: value }),
                },
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data?.message ?? 'Email pemulihan gagal dikirim. Coba lagi nanti.');
                return;
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
                                    Jika akun dan email kamu terdaftar,{' '}
                                    {emailSent === 'password'
                                        ? 'link reset kata sandi'
                                        : 'pertanyaan keamanan yang tersimpan'}{' '}
                                    sudah dikirim ke email pemulihanmu.
                                    <br />
                                    Periksa kotak masuk atau folder spam.
                                </p>
                                <button className="daftar-submit" onClick={() => setLocation('/login')}>
                                    Kembali ke Login
                                </button>
                                <button type="button" className="reset-secondary" onClick={() => setEmailSent(null)}>
                                    Coba lagi
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