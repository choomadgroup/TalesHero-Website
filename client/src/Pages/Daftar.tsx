import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { IoHome } from 'react-icons/io5';
import { GiPartyPopper } from 'react-icons/gi';

const STARS = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 4.9) % 100}%`,
    top: `${(i * 6.7) % 90}%`,
    delay: `${(i * 0.28) % 3}s`,
    duration: `${1.8 + (i % 4) * 0.6}s`,
    size: `${4 + (i % 5)}px`,
}));

const DAFTAR_CHARS = [
    { src: '/Image/Karakter/Art/Rina.png',  alt: 'Rina',  delay: 0.2,  dur: 2.4 },
    { src: '/Image/Karakter/Art/LaLa.png',  alt: 'LaLa',  delay: 0,    dur: 2.8 },
    { src: '/Image/Karakter/Art/Chloe.png', alt: 'Chloe', delay: 0.35, dur: 2.2 },
    { src: '/Image/Karakter/Art/Miho.png',  alt: 'Miho',  delay: 0.5,  dur: 3.1 },
];

export default function Daftar() {
    useEffect(() => {
        document.title = 'Daftar — Segera Hadir | Tales Hero Indonesia';
    }, []);
    const [, setLocation] = useLocation();

    return (
        <div className="cs-page cs-page--daftar">
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
                className="cs-page__card"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <div className="cs-page__chars">
                    {DAFTAR_CHARS.map((c, i) => (
                        <motion.img
                            key={c.alt}
                            src={c.src}
                            alt={c.alt}
                            className="cs-page__char-multi"
                            animate={{ y: [0, -14, 0], rotate: [0, 2, 0, -2, 0] }}
                            transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ zIndex: i === 1 ? 2 : 1 }}
                        />
                    ))}
                </div>

                <motion.div
                    className="cs-page__badge cs-page__badge--pink"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                >
                    <GiPartyPopper size={14} /> Pendaftaran Segera Dibuka!
                </motion.div>

                <h1 className="cs-page__title">
                    Daftar Akun<br />Sebentar Lagi!
                </h1>
                <p className="cs-page__desc">
                    Sistem pendaftaran akun Tales Hero Indonesia sedang dalam tahap persiapan.<br />
                    Pantau terus media sosial kami untuk info pembukaan pertama! 🎉
                </p>

                <img src="/Image/tales-hero-banner.png" alt="Tales Hero" className="cs-page__logo" />

                <button className="cs-page__btn cs-page__btn--pink" onClick={() => setLocation('/')}>
                    <IoHome size={16} />
                    Kembali ke Beranda
                </button>
            </motion.div>
        </div>
    );
}
