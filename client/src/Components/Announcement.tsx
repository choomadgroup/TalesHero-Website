import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { asset } from '@/Lib/utils';
import { allArticles, CATEGORY_LABELS, CATEGORY_COLORS } from '@/Lib/newsLoader';
import CharacterSpotlight from './CharacterSpotlight';

// Ambil 4 artikel terbaru dari News, tandai isNew jika ≤ 7 hari
const now = Date.now();
const ANNOUNCEMENTS = allArticles.slice(0, 4).map((a) => ({
    slug:    a.slug,
    category: a.category,
    tag:     CATEGORY_LABELS[a.category],
    title:   a.title,
    isNew:   a.date ? (now - new Date(a.date).getTime()) / 86_400_000 <= 7 : false,
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
        <section style={{ background: '#fff', padding: '1.5rem 60px' }}>
            <div
                style={{
                    maxWidth: 1320,
                    margin: '0 auto',
                    display: 'flex',
                    gap: 20,
                    alignItems: 'stretch',
                }}
            >
                {/* ── Left panel ── */}
                <div
                    style={{
                        flex: '0 0 400px',
                        background: '#fff',
                        border: '1.5px solid #e8e8e8',
                        borderRadius: 12,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 16px',
                            borderBottom: '1.5px solid #f0f0f0',
                        }}
                    >
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
                            Pemberitahuan
                        </span>
                        <button
                            onClick={() => navigate('/news')}
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                border: '1.5px solid #ddd',
                                background: '#fafafa',
                                cursor: 'pointer',
                                fontSize: 15,
                                lineHeight: 1,
                                color: '#555',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            +
                        </button>
                    </div>

                    {/* List */}
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {ANNOUNCEMENTS.map((item, i) => {
                            const accent = CATEGORY_COLORS[item.category];
                            const bgLight = `${accent}18`;
                            const border  = `${accent}55`;
                            return (
                            <li
                                key={item.slug}
                                className="ann-row"
                                onClick={() => navigate(`/news/${item.category}/${item.slug}`)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 16px',
                                    borderBottom: i < ANNOUNCEMENTS.length - 1 ? '1px solid #f5f5f5' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                    overflow: 'hidden',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#fafaf8')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* Tag — warna sesuai kategori, lebar tetap supaya judul sejajar */}
                                <span
                                    style={{
                                        flexShrink: 0,
                                        width: 84,
                                        textAlign: 'center',
                                        padding: '2px 0',
                                        background: bgLight,
                                        color: accent,
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        border: `1px solid ${border}`,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {item.tag}
                                </span>

                                {/* Judul — marquee saat hover kalau teks kepanjangan */}
                                <span className="ann-title">
                                    <span style={{ fontSize: 12, color: '#333', lineHeight: 1.45 }}>
                                        {item.title}
                                    </span>
                                </span>
                            </li>
                            );
                        })}
                    </ul>
                </div>

                {/* ── Slideshow ── */}
                <div
                    style={{
                        flex: '0 0 480px',
                        borderRadius: 12,
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#000',
                    }}
                >
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
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 5,
                            zIndex: 2,
                        }}
                    >
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
