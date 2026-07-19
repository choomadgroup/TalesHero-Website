import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { IoHome } from 'react-icons/io5';

const STARS = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 5.3) % 100}%`,
    top: `${(i * 7.1) % 90}%`,
    delay: `${(i * 0.35) % 3}s`,
    duration: `${2 + (i % 4) * 0.5}s`,
    size: `${5 + (i % 4)}px`,
}));

export default function Login() {
    useEffect(() => {
        document.title = 'Login — Segera Hadir | Tales Hero Indonesia';
    }, []);
    const [, setLocation] = useLocation();

    return (
        <div className="cs-page cs-page--login">
            {/* Animated background stars */}
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
                className="cs-page__card"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                {/* Character floating */}
                <motion.img
                    src="/Image/Karakter/Art/Kai.png"
                    alt="Kai"
                    className="cs-page__char"
                    animate={{ y: [0, -14, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Badge */}
                <motion.div
                    className="cs-page__badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                >
                    🚧 Under Construction
                </motion.div>

                <h1 className="cs-page__title">
                    Fitur Login<br />Segera Hadir!
                </h1>
                <p className="cs-page__desc">
                    Sistem login lagi dipersiapkan buat kamu. <br />
                    Nantikan update selanjutnya dan tetap semangat berlari! 🏃‍♂️
                </p>

                <img src="/Image/tales-hero-banner.png" alt="Tales Hero" className="cs-page__logo" />

                <button className="cs-page__btn" onClick={() => setLocation('/')}>
                    <IoHome size={16} />
                    Kembali ke Beranda
                </button>
            </motion.div>
        </div>
    );
}
