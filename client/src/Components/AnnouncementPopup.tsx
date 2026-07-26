import { useState, useEffect } from 'react';
import { asset } from '@/Lib/utils';

// Tambahkan/hapus path gambar di sini untuk mengatur popup
const POPUP_IMAGES = [
    '/Image/Home/Popup/IMG-POPUP-01.png',
    '/Image/Home/Popup/IMG-POPUP-02.png',
];

// Interval auto-ganti gambar (milidetik)
const AUTO_INTERVAL = 4000;

export default function AnnouncementPopup() {
    const [open, setOpen]       = useState(true);
    const [current, setCurrent] = useState(0);

    const total = POPUP_IMAGES.length;
    const prev  = () => setCurrent(i => (i - 1 + total) % total);
    const next  = () => setCurrent(i => (i + 1) % total);

    // Auto-rotate
    useEffect(() => {
        if (!open || total <= 1) return;
        const id = setInterval(() => setCurrent(i => (i + 1) % total), AUTO_INTERVAL);
        return () => clearInterval(id);
    }, [open, total]);

    // Cegah layout shift (scrollbar hilang/muncul) saat popup terbuka
    useEffect(() => {
        if (open) {
            const w = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow    = 'hidden';
            document.body.style.paddingRight = `${w}px`;
        } else {
            document.body.style.overflow    = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow    = '';
            document.body.style.paddingRight = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => setOpen(false)}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.75)',
                    zIndex: 9998,
                    backdropFilter: 'blur(3px)',
                }}
            />

            {/* Popup */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    maxWidth: 520,
                    width: 'calc(100vw - 2rem)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(250,176,5,0.3)',
                    background: '#1a1a2e',
                }}
            >
                {/* Gambar */}
                <img
                    key={current}
                    src={asset(POPUP_IMAGES[current])}
                    alt={`Pengumuman ${current + 1}`}
                    decoding="async"
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                />

                {/* Navigasi — hanya tampil kalau ada lebih dari 1 gambar */}
                {total > 1 && (
                    <>
                        {/* Panah kiri */}
                        <button
                            onClick={e => { e.stopPropagation(); prev(); }}
                            aria-label="Gambar sebelumnya"
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: 8,
                                transform: 'translateY(-50%)',
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.55)',
                                border: '1.5px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                fontSize: 14,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,176,5,0.8)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.55)')}
                        >‹</button>

                        {/* Panah kanan */}
                        <button
                            onClick={e => { e.stopPropagation(); next(); }}
                            aria-label="Gambar berikutnya"
                            style={{
                                position: 'absolute',
                                top: '50%',
                                right: 8,
                                transform: 'translateY(-50%)',
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.55)',
                                border: '1.5px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                fontSize: 14,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,176,5,0.8)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.55)')}
                        >›</button>

                        {/* Dot indikator */}
                        <div style={{
                            position: 'absolute',
                            bottom: 10,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 6,
                        }}>
                            {POPUP_IMAGES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={e => { e.stopPropagation(); setCurrent(i); }}
                                    aria-label={`Gambar ${i + 1}`}
                                    style={{
                                        width: i === current ? 18 : 8,
                                        height: 8,
                                        borderRadius: 4,
                                        background: i === current ? '#fab005' : 'rgba(255,255,255,0.35)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        transition: 'all 0.2s',
                                    }}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Tombol Close */}
                <button
                    onClick={() => setOpen(false)}
                    aria-label="Tutup pengumuman"
                    style={{
                        position: 'absolute',
                        top: 6,
                        right: 8,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        color: '#fff',
                        fontSize: 13,
                        lineHeight: 1,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,176,5,0.8)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
                >
                    ✕
                </button>
            </div>
        </>
    );
}
