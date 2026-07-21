import { useState, useEffect } from 'react';
import { asset } from '@/Lib/utils';

// Ganti path ini dengan nama file gambar yang kamu taruh di public/Image/
const POPUP_IMAGE = '/Image/Home/Popup/IMG-POPUP-01.png';

export default function AnnouncementPopup() {
    const [open, setOpen] = useState(true);

    // Cegah layout shift (scrollbar hilang/muncul) saat popup terbuka
    useEffect(() => {
        if (open) {
            const w = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${w}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
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
                    background: 'rgba(0, 0, 0, 0.75)',
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
                    src={asset(POPUP_IMAGE)}
                    alt="Pengumuman"
                    style={{
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                    }}
                />

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
