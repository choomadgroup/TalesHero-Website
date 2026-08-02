import { useState, useEffect, useCallback, useRef } from "react";
import { asset } from '@/Lib/utils';
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { IoPeopleOutline } from 'react-icons/io5';
import { IoWifi } from 'react-icons/io5';
import { useAccountCount } from '@/Hooks/use-account-count';
import { useOnlineCount } from '@/Hooks/use-online-count';
import {
    GiCrossedSwords,
    GiScrollUnfurled,
    GiSwordClash,
    GiHeartWings,
    GiWheat,
    GiParkBench,
    GiFishingPole,
} from "react-icons/gi";

const SLIDES = [
    {
        id: 0,
        badge: "Game Online Action Adventure",
        title: "Jadilah Hero\nLegendaris!",
        desc: "Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!",
        bg: "linear-gradient(135deg, #fff8e1 0%, #fff3cd 60%, #ffe082 100%)",
        accent: "#fab005",
        icon: <GiCrossedSwords size={14} />,
        image: asset("/Image/Home/IMG-H01.png"),
    },
    {
        id: 1,
        badge: "Jelajahi Dungeon Epik",
        title: "Ratusan Dungeon\nMenunggumu!",
        desc: "Dari gua bawah tanah yang gelap hingga istana terbang yang megah — setiap dungeon menyimpan tantangan, harta, dan boss legendaris yang siap menghadangmu.",
        bg: "linear-gradient(135deg, #e8eaf6 0%, #dde1f8 60%, #c5caf5 100%)",
        accent: "#5c6bc0",
        icon: <GiScrollUnfurled size={14} />,
        image: asset("/Image/Home/IMG-H02.png"),
    },
    {
        id: 2,
        badge: "Bergabung dengan Guild",
        title: "Satu Guild,\nSatu Kemenangan!",
        desc: "Bangun guild terkuat bersama teman-temanmu, kuasai papan peringkat server, dan jadikan nama guild-mu dikenal di seluruh penjuru Kerajaan Tales!",
        bg: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 60%, #a5d6a7 100%)",
        accent: "#388e3c",
        icon: <GiSwordClash size={14} />,
        image: asset("/Image/Home/IMG-H03.png"),
    },
    {
        id: 3,
        badge: "Couple & Married System",
        title: "Temukan Belahan\nJiwamu!",
        desc: "Jalin hubungan spesial di dunia Tales Hero — ajak pasanganmu berpetualangan bersama, lakukan ritual pernikahan sakral, dan dapatkan bonus eksklusif khusus untuk pasangan yang telah bersatu!",
        bg: "linear-gradient(135deg, #fce4ec 0%, #f8bbd0 60%, #f48fb1 100%)",
        accent: "#e91e63",
        icon: <GiHeartWings size={14} />,
        image: asset("/Image/Home/IMG-H04.png"),
    },
    {
        id: 4,
        badge: "Farm & Garden System",
        title: "Tanam, Panen,\ndan Berkembang!",
        desc: "Kelola ladang dan kebunmu sendiri di dunia Tales Hero — tanam berbagai tanaman langka, panen hasil bumi untuk crafting item powerful, dan jadikan farm-mu sumber penghasilan utama di kerajaan!",
        bg: "linear-gradient(135deg, #f1f8e9 0%, #dcedc8 60%, #c5e1a5 100%)",
        accent: "#558b2f",
        icon: <GiWheat size={14} />,
        image: asset("/Image/Home/IMG-H05.png"),
    },
    {
        id: 5,
        badge: "Park & Plaza System",
        title: "Bersantai di\nTaman Kerajaan!",
        desc: "Nikmati waktu santai di Park & Plaza Tales Hero — bertemu sesama hero, ikuti event mingguan, berdagang di pasar rakyat, dan perkuat hubungan sosialmu di pusat kota yang selalu hidup dan meriah!",
        bg: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 60%, #90caf9 100%)",
        accent: "#1565c0",
        icon: <GiParkBench size={14} />,
        image: asset("/Image/Home/IMG-H06.png"),
    },
    {
        id: 6,
        badge: "Fishing System",
        title: "Pancing Ikan,\nRaih Hadiah!",
        desc: "Lemparkan kailmu ke danau, sungai, hingga lautan dalam Tales Hero — tangkap ratusan jenis ikan langka, tukarkan hasilnya dengan item eksklusif, dan buktikan siapa pemancing terhebat di kerajaan!",
        bg: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 60%, #80deea 100%)",
        accent: "#00838f",
        icon: <GiFishingPole size={14} />,
        image: asset("/Image/Home/IMG-H07.png"),
    },
];

const INTERVAL = 8000;

export default function HeroBanner() {
    const [current, setCurrent] = useState(0);
    const [, setLocation] = useLocation();
    const accountCount = useAccountCount();
    const onlineCount  = useOnlineCount();

    // ── Online players tooltip ────────────────────────────────
    const [showOnlineTip, setShowOnlineTip]     = useState(false);
    const [onlinePlayers, setOnlinePlayers]     = useState<string[] | null>(null);
    const [loadingPlayers, setLoadingPlayers]   = useState(false);
    const onlineBadgeRef  = useRef<HTMLSpanElement>(null);
    const hideTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openTip  = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setShowOnlineTip(true);
    };
    const closeTip = () => {
        hideTimerRef.current = setTimeout(() => setShowOnlineTip(false), 120);
    };

    const fetchOnlinePlayers = useCallback(async () => {
        if (loadingPlayers) return;
        setLoadingPlayers(true);
        try {
            const r = await fetch('/api/stats/online-players');
            if (r.ok) {
                const data = await r.json();
                setOnlinePlayers(Array.isArray(data) ? data : []);
            }
        } catch { /* silent */ }
        finally { setLoadingPlayers(false); }
    }, [loadingPlayers]);

    const next = useCallback(() => {
        setCurrent((c) => (c + 1) % SLIDES.length);
    }, []);

    useEffect(() => {
        const timer = setInterval(next, INTERVAL);
        return () => clearInterval(timer);
    }, [next]);

    const slide = SLIDES[current];

    return (
        <section id="about" style={{ padding: 0 }}>
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
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                            <p
                                className="hero-banner__badge"
                                style={{ color: slide.accent }}
                            >
                                {slide.icon}&nbsp;&nbsp;{slide.badge}
                            </p>

                            <h1 className="hero-banner__title">
                                {slide.title.split("\n").map((line, i) => (
                                    <span key={i}>
                                        {line}
                                        {i <
                                            slide.title.split("\n").length -
                                                1 && <br />}
                                    </span>
                                ))}
                            </h1>

                            <p className="hero-banner__desc">{slide.desc}</p>

                            <div className="hero-banner__actions">
                                <button
                                    className="hero-banner__btn-primary"
                                    style={{ background: slide.accent }}
                                    onClick={() => setLocation("/download")}
                                >
                                    Download
                                </button>
                                <button
                                    className="hero-banner__btn-secondary"
                                    onClick={() => setLocation("/daftar")}
                                >
                                    Daftar Sekarang
                                </button>
                                {accountCount !== null && (
                                    <span className="hero-banner__players-badge">
                                        <IoPeopleOutline size={13} />
                                        {accountCount.toLocaleString('id-ID')} Akun Terdaftar
                                    </span>
                                )}
                                {onlineCount !== null && (
                                    <span
                                        ref={onlineBadgeRef}
                                        className="hero-banner__online-badge"
                                        style={{ position: 'relative' }}
                                        onMouseEnter={() => { openTip(); fetchOnlinePlayers(); }}
                                        onMouseLeave={closeTip}
                                    >
                                        <span className="hero-banner__online-dot" />
                                        <IoWifi size={13} />
                                        {onlineCount.toLocaleString('id-ID')} Online

                                        {/* Tooltip — pointerEvents aktif agar bisa di-scroll */}
                                        {showOnlineTip && (
                                            <span
                                                onMouseEnter={openTip}
                                                onMouseLeave={closeTip}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 'calc(100% + 8px)',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    background: 'rgba(10,10,24,0.97)',
                                                    border: '1px solid rgba(86,145,240,0.35)',
                                                    borderRadius: 10,
                                                    padding: '10px 14px',
                                                    minWidth: 180,
                                                    maxWidth: 240,
                                                    maxHeight: 220,
                                                    overflowY: 'auto',
                                                    boxShadow: '0 6px 32px rgba(0,0,0,0.5)',
                                                    zIndex: 200,
                                                    whiteSpace: 'normal',
                                                    cursor: 'default',
                                                }}>
                                                <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#5691f0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                                                    Player Online
                                                </span>
                                                {loadingPlayers && (
                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Memuat…</span>
                                                )}
                                                {!loadingPlayers && onlinePlayers !== null && onlinePlayers.length === 0 && (
                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>Tidak ada player online</span>
                                                )}
                                                {!loadingPlayers && onlinePlayers && onlinePlayers.map((nick, i) => (
                                                    <span key={i} style={{ display: 'block', fontSize: 12, color: '#e2e8f0', padding: '2px 0', borderBottom: i < onlinePlayers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                                        {nick}
                                                    </span>
                                                ))}
                                                {/* arrow */}
                                                <span style={{ position: 'absolute', bottom: -6, left: '50%', width: 10, height: 10, background: 'rgba(10,10,24,0.97)', border: '1px solid rgba(86,145,240,0.35)', borderTop: 'none', borderLeft: 'none', transform: 'translateX(-50%) rotate(45deg)' }} />
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>

                            {/* Dot indicators — sejajar dengan tombol */}
                            <div className="hero-banner__dots">
                                {SLIDES.map((s, i) => (
                                    <button
                                        key={s.id}
                                        className={`hero-banner__dot ${i === current ? "hero-banner__dot--active" : ""}`}
                                        style={{ "--dot-color": SLIDES[i].accent } as React.CSSProperties}
                                        onClick={() => setCurrent(i)}
                                        aria-label={`Slide ${i + 1}`}
                                    />
                                ))}
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
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                            <img src={slide.image} alt={slide.badge} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress bar */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        className="hero-banner__progress"
                        style={{ background: slide.accent }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                            duration: INTERVAL / 1000,
                            ease: "linear",
                        }}
                    />
                </AnimatePresence>
            </div>
        </section>
    );
}
