import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-scroll';
import { useLocation } from 'wouter';
import { GiCrossedSwords, GiScrollUnfurled, GiSwordClash, GiHeartWings, GiWheat, GiParkBench, GiFishingPole } from 'react-icons/gi';
import { MdOutlineArrowDownward } from 'react-icons/md';

const SLIDES = [
    {
        id: 0,
        badge: 'Game Online Action Adventure',
        title: 'Jadilah Hero\nLegendaris!',
        desc: 'Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!',
        bg: 'linear-gradient(135deg, #fff8e1 0%, #fff3cd 60%, #ffe082 100%)',
        accent: '#fab005',
        icon: <GiCrossedSwords size={14} />,
        image: '/Image/Home/IMG-H01.png',
    },
    {
        id: 1,
        badge: 'Jelajahi Dungeon Epik',
        title: 'Ratusan Dungeon\nMenunggumu!',
        desc: 'Dari gua bawah tanah yang gelap hingga istana terbang yang megah — setiap dungeon menyimpan tantangan, harta, dan boss legendaris yang siap menghadangmu.',
        bg: 'linear-gradient(135deg, #e8eaf6 0%, #dde1f8 60%, #c5caf5 100%)',
        accent: '#5c6bc0',
        icon: <GiScrollUnfurled size={14} />,
        image: '/Image/Home/IMG-H02.png',
    },
    {
        id: 2,
        badge: 'Bergabung dengan Guild',
        title: 'Satu Guild,\nSatu Kemenangan!',
        desc: 'Bangun guild terkuat bersama teman-temanmu, kuasai papan peringkat server, dan jadikan nama guild-mu dikenal di seluruh penjuru Kerajaan Tales!',
        bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 60%, #a5d6a7 100%)',
        accent: '#388e3c',
        icon: <GiSwordClash size={14} />,
        image: '/Image/Home/IMG-H03.png',
    },
    {
        id: 3,
        badge: 'Couple & Married System',
        title: 'Temukan Belahan\nJiwamu!',
        desc: 'Jalin hubungan spesial di dunia Tales Hero — ajak pasanganmu berpetualangan bersama, lakukan ritual pernikahan sakral, dan dapatkan bonus eksklusif khusus untuk pasangan yang telah bersatu!',
        bg: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 60%, #f48fb1 100%)',
        accent: '#e91e63',
        icon: <GiHeartWings size={14} />,
        image: '/Image/Home/IMG-H04.png',
    },
    {
        id: 4,
        badge: 'Farm & Garden System',
        title: 'Tanam, Panen,\ndan Berkembang!',
        desc: 'Kelola ladang dan kebunmu sendiri di dunia Tales Hero — tanam berbagai tanaman langka, panen hasil bumi untuk crafting item powerful, dan jadikan farm-mu sumber penghasilan utama di kerajaan!',
        bg: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 60%, #c5e1a5 100%)',
        accent: '#558b2f',
        icon: <GiWheat size={14} />,
        image: '/Image/Home/IMG-H05.png',
    },
    {
        id: 5,
        badge: 'Park & Plaza System',
        title: 'Bersantai di\nTaman Kerajaan!',
        desc: 'Nikmati waktu santai di Park & Plaza Tales Hero — bertemu sesama hero, ikuti event mingguan, berdagang di pasar rakyat, dan perkuat hubungan sosialmu di pusat kota yang selalu hidup dan meriah!',
        bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 60%, #90caf9 100%)',
        accent: '#1565c0',
        icon: <GiParkBench size={14} />,
        image: '/Image/Home/IMG-H06.png',
    },
    {
        id: 6,
        badge: 'Fishing System',
        title: 'Pancing Ikan,\nRaih Hadiah!',
        desc: 'Lemparkan kailmu ke danau, sungai, hingga lautan dalam Tales Hero — tangkap ratusan jenis ikan langka, tukarkan hasilnya dengan item eksklusif, dan buktikan siapa pemancing terhebat di kerajaan!',
        bg: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 60%, #80deea 100%)',
        accent: '#00838f',
        icon: <GiFishingPole size={14} />,
        image: '/Image/Home/IMG-H07.png',
    },
];

const INTERVAL = 8000;

export default function HeroBanner() {
    const [current, setCurrent] = useState(0);
    const [, setLocation] = useLocation();

    const next = useCallback(() => {
        setCurrent(c => (c + 1) % SLIDES.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(next, INTERVAL);
        return () => clearInterval(timer);
    }, [next]);

    const slide = SLIDES[current];

    return (
        <section id="about" style={{ padding: 0, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <div className="hero-banner">
                {/* Background transition */}
                <AnimatePresence mode="sync">
                    <motion.div
                        key={current}
                        className="hero-banner__bg"
                        style={{ background: slide.bg }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                    />
                </AnimatePresence>

                {/* Two-column row */}
                <div className="hero-banner__row">
                    {/* Left: text content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            className="hero-banner__content"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <p className="hero-banner__badge" style={{ color: slide.accent }}>
                                {slide.icon}&nbsp;&nbsp;{slide.badge}
                            </p>

                            <h1 className="hero-banner__title">
                                {slide.title.split('\n').map((line, i) => (
                                    <span key={i}>{line}{i < slide.title.split('\n').length - 1 && <br />}</span>
                                ))}
                            </h1>

                            <p className="hero-banner__desc">{slide.desc}</p>

                            <div className="hero-banner__actions">
                                <Link to="section-one" smooth duration={500}>
                                    <button className="hero-banner__btn-primary" style={{ background: slide.accent }}>
                                        Lihat Fitur <MdOutlineArrowDownward size={15} style={{ verticalAlign: 'middle' }} />
                                    </button>
                                </Link>
                                <button className="hero-banner__btn-secondary" onClick={() => setLocation('/daftar')}>
                                    Daftar Sekarang
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Right: cover image */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`img-${current}`}
                            className="hero-banner__cover"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                            <img src={slide.image} alt={slide.badge} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dot indicators */}
                <div className="hero-banner__dots">
                    {SLIDES.map((s, i) => (
                        <button
                            key={s.id}
                            className={`hero-banner__dot ${i === current ? 'hero-banner__dot--active' : ''}`}
                            style={{ '--dot-color': SLIDES[i].accent } as React.CSSProperties}
                            onClick={() => setCurrent(i)}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Progress bar */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        className="hero-banner__progress"
                        style={{ background: slide.accent }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: INTERVAL / 1000, ease: 'linear' }}
                    />
                </AnimatePresence>
            </div>
        </section>
    );
}
