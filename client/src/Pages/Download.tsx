import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { IoLogoWindows, IoLogoAndroid, IoLogoApple, IoCheckmark, IoChevronForward } from 'react-icons/io5';
import { GiProcessor, GiRam, GiSave, GiVideoCamera } from 'react-icons/gi';
import Header from '../Components/Header';
import Footer from '../Components/Footer';

const PLATFORMS = [
    {
        id: 'windows',
        icon: <IoLogoWindows size={40} />,
        label: 'Windows PC',
        version: 'Versi 1.0.0',
        size: '1.2 GB',
        btn: 'Unduh Sekarang',
        color: '#0078d4',
        available: true,
        href: '#',
    },
    {
        id: 'android',
        icon: <IoLogoAndroid size={40} />,
        label: 'Android',
        version: 'Versi 1.0.0',
        size: '650 MB',
        btn: 'Unduh APK',
        color: '#3ddc84',
        available: true,
        href: '#',
    },
    {
        id: 'ios',
        icon: <IoLogoApple size={40} />,
        label: 'iOS / App Store',
        version: 'Segera Hadir',
        size: '—',
        btn: 'Coming Soon',
        color: '#555',
        available: false,
        href: '#',
    },
];

const STEPS = [
    { num: '01', title: 'Unduh File', desc: 'Pilih platform kamu dan klik tombol unduh.' },
    { num: '02', title: 'Install Game', desc: 'Buka file installer dan ikuti langkah-langkah pemasangan.' },
    { num: '03', title: 'Mulai Bermain!', desc: 'Buat akun, pilih karakter, dan mulai petualanganmu!' },
];

const SPECS = [
    { icon: <GiProcessor size={20} />, label: 'Prosesor', min: 'Intel Core i3', rec: 'Intel Core i5 / AMD Ryzen 5' },
    { icon: <GiRam size={20} />, label: 'RAM', min: '4 GB', rec: '8 GB atau lebih' },
    { icon: <GiSave size={20} />, label: 'Penyimpanan', min: '2 GB tersedia', rec: '5 GB tersedia' },
    { icon: <GiVideoCamera size={20} />, label: 'VGA', min: 'Intel HD Graphics', rec: 'NVIDIA GTX 950 / AMD RX 560' },
];

const FEATURES = ['Gratis Dimainkan', 'Update Rutin', 'Anti-Cheat System', 'Cross-Platform (Coming Soon)', 'Event Mingguan'];

export default function Download() {
    useEffect(() => {
        document.title = 'Download — Tales Hero Indonesia';
        window.scrollTo({ top: 0 });
    }, []);
    const [, setLocation] = useLocation();

    return (
        <>
            <Header light />

            {/* Hero */}
            <section className="dl-hero">
                <div className="dl-hero__inner">
                    <motion.div
                        className="dl-hero__text"
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="dl-hero__badge">🎮 Download Gratis</span>
                        <h1 className="dl-hero__title">Mulai Petualanganmu<br />di Tales Hero!</h1>
                        <p className="dl-hero__desc">
                            Unduh Tales Hero Indonesia sekarang dan bergabunglah dengan ribuan pemain
                            yang sudah merasakan serunya berlari melintasi dunia fantasi!
                        </p>
                        <div className="dl-hero__feats">
                            {FEATURES.map(f => (
                                <span key={f} className="dl-hero__feat">
                                    <IoCheckmark size={13} /> {f}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                    <div className="dl-hero__chars">
                        {[
                            { src: '/Image/Karakter/Art/Kai.png',     alt: 'Kai',     delay: 0.1, y: 0    },
                            { src: '/Image/Karakter/Art/Rough.png',   alt: 'Rough',   delay: 0,   y: -20  },
                            { src: '/Image/Karakter/Art/Wukong.png',  alt: 'Wukong',  delay: 0.2, y: 0    },
                            { src: '/Image/Karakter/Art/Vera.png',    alt: 'Vera',    delay: 0.15,y: -10  },
                            { src: '/Image/Karakter/Art/Jaka.png',    alt: 'Jaka',    delay: 0.25,y: 0    },
                        ].map((c, i) => (
                            <motion.img
                                key={c.alt}
                                src={c.src}
                                alt={c.alt}
                                className="dl-hero__char-img"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: c.y }}
                                transition={{ duration: 0.6, delay: c.delay }}
                                style={{ filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.4))' }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform cards */}
            <section className="dl-platforms">
                <div className="dl-section-inner">
                    <h2 className="dl-section-title">Pilih Platform</h2>
                    <div className="dl-platform-grid">
                        {PLATFORMS.map((p, i) => (
                            <motion.div
                                key={p.id}
                                className={`dl-platform-card ${!p.available ? 'dl-platform-card--soon' : ''}`}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                            >
                                <div className="dl-platform-card__icon" style={{ color: p.color }}>
                                    {p.icon}
                                </div>
                                <h3 className="dl-platform-card__label">{p.label}</h3>
                                <p className="dl-platform-card__ver">{p.version}</p>
                                {p.available && <p className="dl-platform-card__size">Ukuran: {p.size}</p>}
                                <a
                                    href={p.href}
                                    className={`dl-platform-card__btn ${!p.available ? 'dl-platform-card__btn--soon' : ''}`}
                                    style={p.available ? { background: p.color } : {}}
                                >
                                    {p.btn}
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How to install */}
            <section className="dl-steps">
                <div className="dl-section-inner">
                    <h2 className="dl-section-title">Cara Install</h2>
                    <div className="dl-steps-grid">
                        {STEPS.map((s, i) => (
                            <motion.div
                                key={s.num}
                                className="dl-step-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: i * 0.15, duration: 0.5 }}
                            >
                                <span className="dl-step-card__num">{s.num}</span>
                                <h3 className="dl-step-card__title">{s.title}</h3>
                                <p className="dl-step-card__desc">{s.desc}</p>
                                {i < STEPS.length - 1 && <IoChevronForward className="dl-step-card__arrow" size={20} />}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* System requirements */}
            <section className="dl-specs">
                <div className="dl-section-inner">
                    <h2 className="dl-section-title">Spesifikasi Sistem</h2>
                    <div className="dl-specs-table">
                        <div className="dl-specs-table__head">
                            <span></span>
                            <span>Minimum</span>
                            <span>Rekomendasi</span>
                        </div>
                        {SPECS.map(s => (
                            <div key={s.label} className="dl-specs-table__row">
                                <span className="dl-specs-table__label">
                                    {s.icon} {s.label}
                                </span>
                                <span>{s.min}</span>
                                <span className="dl-specs-table__rec">{s.rec}</span>
                            </div>
                        ))}
                    </div>
                    <p className="dl-specs-note">* Spesifikasi dapat berubah sesuai update game</p>
                </div>
            </section>

            {/* CTA banner */}
            <section className="dl-cta">
                <div className="dl-section-inner dl-cta__inner">
                    <div>
                        <h2 className="dl-cta__title">Siap Berlari? 🏆</h2>
                        <p className="dl-cta__desc">Bergabunglah dengan komunitas Tales Hero Indonesia sekarang!</p>
                    </div>
                    <button className="game-cta-btn" onClick={() => setLocation('/')}>
                        Kembali ke Beranda
                    </button>
                </div>
            </section>

            <Footer />
        </>
    );
}
