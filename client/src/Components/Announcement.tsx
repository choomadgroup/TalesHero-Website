import { useEffect, useState } from 'react';
import { asset } from '@/Lib/utils';

const ANNOUNCEMENTS = [
    { id: 1, tag: 'Informasi', title: 'Pemberitahuan Pemeliharaan Server 21 Juli', isNew: true },
    { id: 2, tag: 'Informasi', title: 'Update Patch 1.4.2 — Fitur Guild War Baru', isNew: true },
    { id: 3, tag: 'Informasi', title: '[Event] Double XP Weekend 19–21 Juli 2026', isNew: false },
    { id: 4, tag: 'Informasi', title: '[Pemberitahuan] Peraturan Baru Anti-Cheat', isNew: false },
];

const SLIDES = [
    '/Image/Home/Slide Pictures/obj-sp-001.jpg',
    '/Image/Home/Slide Pictures/obj-sp-002.png',
];

export default function Announcement() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % SLIDES.length);
        }, 3500);
        return () => clearInterval(timer);
    }, []);

    return (
        <section style={{ background: '#fff', padding: '1.5rem 60px' }}>
            <div
                style={{
                    maxWidth: 1100,
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
                        {ANNOUNCEMENTS.map((item, i) => (
                            <li
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 8,
                                    padding: '8px 16px',
                                    borderBottom: i < ANNOUNCEMENTS.length - 1 ? '1px solid #f5f5f5' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#fafaf8')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span
                                    style={{
                                        flexShrink: 0,
                                        marginTop: 2,
                                        padding: '2px 7px',
                                        background: '#e8f5e9',
                                        color: '#2e7d32',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        border: '1px solid #c8e6c9',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {item.tag}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: '#333',
                                        lineHeight: 1.45,
                                        flex: 1,
                                    }}
                                >
                                    {item.title}
                                </span>
                                {item.isNew && (
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            marginTop: 5,
                                            width: 7,
                                            height: 7,
                                            borderRadius: '50%',
                                            background: '#e53935',
                                            display: 'inline-block',
                                        }}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Slideshow ── */}
                <div
                    style={{
                        flex: 1,
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

            </div>
        </section>
    );
}
