import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-scroll';
import { useLocation } from 'wouter';
import { GiCrossedSwords, GiScrollUnfurled, GiSwordClash } from 'react-icons/gi';
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
    },
    {
        id: 1,
        badge: 'Jelajahi Dungeon Epik',
        title: 'Ratusan Dungeon\nMenunggumu!',
        desc: 'Dari gua bawah tanah yang gelap hingga istana terbang yang megah — setiap dungeon menyimpan tantangan, harta, dan boss legendaris yang siap menghadangmu.',
        bg: 'linear-gradient(135deg, #e8eaf6 0%, #dde1f8 60%, #c5caf5 100%)',
        accent: '#5c6bc0',
        icon: <GiScrollUnfurled size={14} />,
    },
    {
        id: 2,
        badge: 'Bergabung dengan Guild',
        title: 'Satu Guild,\nSatu Kemenangan!',
        desc: 'Bangun guild terkuat bersama teman-temanmu, kuasai papan peringkat server, dan jadikan nama guild-mu dikenal di seluruh penjuru Kerajaan Tales!',
        bg: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 60%, #a5d6a7 100%)',
        accent: '#388e3c',
        icon: <GiSwordClash size={14} />,
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

                {/* Banner image (decorative right side) */}
                <div className="hero-banner__img-wrap">
                    <img src="/Image/tales-hero-banner.png" alt="Tales Hero" className="hero-banner__img" />
                </div>

                {/* Content */}
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

                        <h1 className="hero-banner__title" style={{ '--accent': slide.accent } as React.CSSProperties}>
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
