import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { IoLogoWindows, IoCheckmark, IoChevronForward, IoDownloadOutline } from 'react-icons/io5';
import { GiProcessor, GiRam, GiVideoCamera } from 'react-icons/gi';
import { MdComputer, MdMemory } from 'react-icons/md';
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
];

const STEPS = [
    { num: '01', title: 'Unduh File', desc: 'Pilih platform kamu dan klik tombol unduh.' },
    { num: '02', title: 'Install Game', desc: 'Buka file installer dan ikuti langkah-langkah pemasangan.' },
    { num: '03', title: 'Mulai Bermain!', desc: 'Buat akun, pilih karakter, dan mulai petualanganmu!' },
];

const SPECS = [
    {
        icon: <GiProcessor size={20} />,
        label: 'CPU',
        min: 'Core2 Duo atau lebih tinggi',
        rec: 'Intel i5 3GHz atau Ryzen 5 3GHz atau lebih tinggi',
    },
    {
        icon: <GiVideoCamera size={20} />,
        label: 'VGA',
        min: 'Radeon HD 5000 atau lebih tinggi\nGeForce GTS 400 atau lebih tinggi',
        rec: 'Radeon HD 6000 atau lebih tinggi\nGeForce GTS 700 atau lebih tinggi',
    },
    {
        icon: <GiRam size={20} />,
        label: 'RAM',
        min: '4 GB',
        rec: '8 GB',
    },
    {
        icon: <MdComputer size={20} />,
        label: 'OS',
        min: 'Windows 10 atau lebih baru (tidak didukung oleh MAC OS)',
        rec: 'Windows 10 atau lebih baru (tidak didukung oleh MAC OS)',
        same: true,
    },
    {
        icon: <MdMemory size={20} />,
        label: 'DirectX',
        min: 'DirectX 11 atau lebih tinggi',
        rec: 'DirectX 11 atau lebih tinggi',
        same: true,
    },
];

const DRIVERS = [
    {
        id: 'nvidia',
        logo: 'NVIDIA',
        logoClass: 'dl-driver-card__logo--nvidia',
        href: 'https://www.nvidia.com/Download/index.aspx',
    },
    {
        id: 'amd',
        logo: 'AMD',
        logoClass: 'dl-driver-card__logo--amd',
        href: 'https://www.amd.com/en/support',
    },
    {
        id: 'intel',
        logo: 'intel',
        logoClass: 'dl-driver-card__logo--intel',
        href: 'https://www.intel.com/content/www/us/en/download-center/home.html',
    },
    {
        id: 'directx',
        logo: 'DirectX',
        logoClass: 'dl-driver-card__logo--directx',
        href: 'https://www.microsoft.com/en-us/download/details.aspx?id=35',
    },
];

const FEATURES = ['Gratis Dimainkan', 'Update Rutin', 'Anti-Cheat System', 'Khusus Windows PC', 'Event Mingguan'];

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

            {/* Download banner */}
            <section className="dl-banner">
                <div className="dl-section-inner">
                    <motion.div
                        className="dl-banner__card"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55 }}
                    >
                        {/* characters — left panel */}
                        <div className="dl-banner__chars">
                            <motion.img
                                src="/Image/Karakter/Art/Rough.png"
                                alt="Rough"
                                className="dl-banner__char dl-banner__char--back"
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                animate={{ y: [0, -12, 0] }}
                            />
                            <motion.img
                                src="/Image/Karakter/Art/Kai.png"
                                alt="Kai"
                                className="dl-banner__char dl-banner__char--front"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.25 }}
                                animate={{ y: [0, -16, 0] }}
                            />
                            <motion.img
                                src="/Image/Karakter/Art/Vera.png"
                                alt="Vera"
                                className="dl-banner__char dl-banner__char--side"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                animate={{ y: [0, -9, 0] }}
                            />
                        </div>

                        {/* content — right panel */}
                        <div className="dl-banner__content">
                            <span className="dl-banner__eyebrow">
                                <IoLogoWindows size={14} /> Windows PC Only
                            </span>
                            <h3 className="dl-banner__title">
                                Unduh<br />Tales Hero<br />
                                <em>Indonesia</em>
                            </h3>
                            <p className="dl-banner__sub">
                                Game aksi petualangan gratis.<br />
                                Segera hadir untuk PC — stay tuned!
                            </p>
                            <div className="dl-banner__btn">
                                🚧&nbsp; Coming Soon
                            </div>
                            {/* decorative dots */}
                            <div className="dl-banner__dots" aria-hidden>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <span key={i} className="dl-banner__dot" />
                                ))}
                            </div>
                        </div>

                        {/* accent blob */}
                        <div className="dl-banner__blob" aria-hidden />
                    </motion.div>
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
                    <h2 className="dl-section-title">Spesifikasi Komputer TalesRunner</h2>
                    <div className="dl-specs-table">
                        <div className="dl-specs-table__head">
                            <span>Barang</span>
                            <span>Spesifikasi Minimum</span>
                            <span>Spesifikasi yang Direkomendasikan</span>
                        </div>
                        {SPECS.map(s => (
                            <div key={s.label} className="dl-specs-table__row">
                                <span className="dl-specs-table__label">
                                    {s.icon} {s.label}
                                </span>
                                {s.same ? (
                                    <span className="dl-specs-table__colspan" style={{ gridColumn: '2 / 4' }}>
                                        {s.min}
                                    </span>
                                ) : (
                                    <>
                                        <span style={{ whiteSpace: 'pre-line' }}>{s.min}</span>
                                        <span className="dl-specs-table__rec" style={{ whiteSpace: 'pre-line' }}>{s.rec}</span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="dl-specs-note">* Game ini hanya tersedia untuk Windows PC — tidak mendukung iOS dan Android</p>
                </div>
            </section>

            {/* Driver downloads */}
            <section className="dl-drivers">
                <div className="dl-section-inner">
                    <h2 className="dl-section-title">Unduh Driver</h2>
                    <div className="dl-driver-grid">
                        {DRIVERS.map((d, i) => (
                            <motion.a
                                key={d.id}
                                href={d.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="dl-driver-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                            >
                                <span className={`dl-driver-card__logo ${d.logoClass}`}>{d.logo}</span>
                                <p className="dl-driver-card__name">{d.logo}</p>
                                <span className="dl-driver-card__btn">
                                    <IoDownloadOutline size={14} /> Unduh
                                </span>
                            </motion.a>
                        ))}
                    </div>
                    <ul className="dl-driver-notes">
                        <li>Dengan menginstal driver grafis versi terbaru, Anda dapat menikmati permainan di lingkungan yang lebih baik.</li>
                        <li>Pastikan untuk memeriksa spesifikasi PC Anda dan sistem operasi serta kartu grafis Anda, lalu instal driver yang sesuai dengan jenis Anda.</li>
                        <li>Jika Anda mengalami kesalahan selama penginstalan driver, perbarui Kerangka Kerja Microsoft.Net.</li>
                        <li>Waktu instalasi mungkin tertunda tergantung pada sistem dan lingkungan jaringan Anda.</li>
                    </ul>
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
