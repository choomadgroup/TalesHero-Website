import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { IoCheckmarkCircle, IoCloseCircleOutline, IoHome, IoMailOutline } from 'react-icons/io5';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { usePageMeta } from '@/Hooks/use-page-meta';

const STARS = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${(i * 6.1) % 100}%`,
    top: `${(i * 8.3) % 90}%`,
    delay: `${(i * 0.24) % 3}s`,
    duration: `${1.8 + (i % 4) * 0.6}s`,
    size: `${4 + (i % 5)}px`,
}));

type State =
    | { status: 'loading' }
    | { status: 'success'; username?: string; message: string }
    | { status: 'error'; message: string };

export default function VerifyRegistration() {
    usePageMeta({
        title: 'Verifikasi Akun — Tales Hero Indonesia',
        description: 'Verifikasi email untuk mengaktifkan akun Tales Hero Indonesia.',
    });

    const [, setLocation] = useLocation();
    const [state, setState] = useState<State>({ status: 'loading' });

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('token');
        if (!token) {
            setState({ status: 'error', message: 'Link verifikasi tidak lengkap.' });
            return;
        }

        fetch(`/auth/verify-registration?token=${encodeURIComponent(token)}`)
            .then(async response => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.message ?? 'Verifikasi gagal. Coba lagi nanti.');
                return data;
            })
            .then(data => setState({
                status: 'success',
                username: data.username,
                message: data.message ?? 'Email berhasil diverifikasi. Akun kamu sudah aktif.',
            }))
            .catch(error => setState({
                status: 'error',
                message: error instanceof Error ? error.message : 'Verifikasi gagal. Coba lagi nanti.',
            }));
    }, []);

    return (
        <>
            <Header />
            <div className="cs-page cs-page--centered cs-page--verify">
                <div className="cs-page__bg">
                    {STARS.map(star => (
                        <span
                            key={star.id}
                            className="cs-page__star cs-page__star--pink"
                            style={{
                                left: star.left,
                                top: star.top,
                                width: star.size,
                                height: star.size,
                                animationDelay: star.delay,
                                animationDuration: star.duration,
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    className="cs-page__card verify-card"
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                >
                    {state.status === 'loading' ? (
                        <div className="verify-state">
                            <div className="verify-skeleton" aria-label="Memverifikasi email" aria-busy="true">
                                <span className="verify-skeleton__icon"><IoMailOutline /></span>
                                <span className="verify-skeleton__title" />
                                <span className="verify-skeleton__line" />
                                <span className="verify-skeleton__line verify-skeleton__line--short" />
                            </div>
                        </div>
                    ) : state.status === 'success' ? (
                        <div className="verify-state">
                            <IoCheckmarkCircle className="verify-state__icon verify-state__icon--success" />
                            <h1 className="verify-state__title">Email Berhasil Diverifikasi!</h1>
                            <p className="verify-state__desc">
                                {state.username && <>Selamat datang, <strong>{state.username}</strong>!<br /></>}
                                {state.message}
                            </p>
                            <button className="cs-page__btn cs-page__btn--pink" onClick={() => setLocation('/login')}>
                                Masuk ke Akun
                            </button>
                        </div>
                    ) : (
                        <div className="verify-state">
                            <IoCloseCircleOutline className="verify-state__icon verify-state__icon--error" />
                            <h1 className="verify-state__title">Verifikasi Belum Berhasil</h1>
                            <p className="verify-state__desc">{state.message}</p>
                            <button className="cs-page__btn cs-page__btn--pink" onClick={() => setLocation('/daftar')}>
                                Daftar Kembali
                            </button>
                        </div>
                    )}

                    <button className="daftar-success__home" onClick={() => setLocation('/')}>
                        <IoHome size={14} /> Kembali ke Beranda
                    </button>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}