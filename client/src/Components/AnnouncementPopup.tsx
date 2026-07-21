import { useState } from 'react';
import { asset } from '@/Lib/utils';

// Ganti path ini dengan nama file gambar yang kamu taruh di public/Image/
const POPUP_IMAGE = '/Image/Home/Popup/IMG-POPUP-01.png';

export default function AnnouncementPopup() {
    const [open, setOpen] = useState(true);

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
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1.5px solid rgba(255,255,255,0.25)',
                        color: '#fff',
                        fontSize: 18,
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
