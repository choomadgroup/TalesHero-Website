import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { asset } from '@/Lib/utils';
import { allArticles, CATEGORY_LABELS, CATEGORY_COLORS } from '@/Lib/newsLoader';
import CharacterSpotlight from './CharacterSpotlight';

// Ambil 3 artikel terbaru saja — artikel ke-4 dst otomatis tidak tampil
const now = Date.now();
const ANNOUNCEMENTS = allArticles.slice(0, 3).map((a) => ({
    slug:     a.slug,
    category: a.category,
    tag:      CATEGORY_LABELS[a.category],
    title:    a.title,
    isNew:    a.date ? (now - new Date(a.date).getTime()) / 86_400_000 <= 7 : false,
}));

const SLIDES = [
    '/Image/Home/Slideshow/obj-sp-001.png',
    '/Image/Home/Slideshow/obj-sp-002.png',
];

export default function Announcement() {
    const [current, setCurrent] = useState(0);
    const [, navigate] = useLocation();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % SLIDES.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="ann-section">
            <div className="ann-grid">

                {/* ── Pemberitahuan list ── */}
                <div className="ann-box ann-box--list">
                    <div className="ann-box__header">
                        <span className="ann-box__title">Pemberitahuan</span>
                        <button
                            className="ann-box__more"
                            onClick={() => navigate('/news')}
                            aria-label="Lihat semua berita"
                        >
                            +
                        </button>
                    </div>

                    <ul className="ann-list">
                        {ANNOUNCEMENTS.map((item) => {
                            const accent  = CATEGORY_COLORS[item.category];
                            const bgLight = `${accent}18`;
                            const border  = `${accent}55`;
                            return (
                                <li
                                    key={item.slug}
                                    className="ann-row"
                                    onClick={() => navigate(`/news/${item.category}/${item.slug}`)}
                                >
                                    <span
                                        className="ann-tag"
                                        style={{ background: bgLight, color: accent, border: `1px solid ${border}` }}
                                    >
                                        {item.tag}
                                    </span>
                                    <span className="ann-title">
                                        <span style={{ fontSize: 11.5, color: '#333', lineHeight: 1.4 }}>
                                            {item.title}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* ── Slideshow ── */}
                <div className="ann-box ann-box--slideshow">
                    {SLIDES.map((src, i) => (
                        <img
                            key={src}
                            src={asset(src)}
                            alt={`Slide ${i + 1}`}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                                opacity: i === current ? 1 : 0,
                                transition: 'opacity 0.7s ease',
                            }}
                        />
                    ))}

                    {/* Dot indicators */}
                    <div style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 5,
                        zIndex: 2,
                    }}>
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                style={{
                                    width: i === current ? 18 : 6,
                                    height: 6,
                                    borderRadius: 3,
                                    background: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Character Spotlight ── */}
                <CharacterSpotlight />

            </div>
        </section>
    );
}
