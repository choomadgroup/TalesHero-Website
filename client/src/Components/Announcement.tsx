import { asset } from '@/Lib/utils';

const ANNOUNCEMENTS = [
    { id: 1, tag: 'Informasi', title: 'Pemberitahuan Pemeliharaan Server 21 Juli', isNew: true },
    { id: 2, tag: 'Informasi', title: 'Update Patch 1.4.2 — Fitur Guild War Baru', isNew: true },
    { id: 3, tag: 'Informasi', title: '[Event] Double XP Weekend 19–21 Juli 2026', isNew: false },
    { id: 4, tag: 'Informasi', title: '[Pemberitahuan] Peraturan Baru Anti-Cheat', isNew: false },
];

export default function Announcement() {
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

                    {/* Buttons */}
                    <div style={{ display: 'flex', borderTop: '1.5px solid #f0f0f0' }}>
                        <button
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                background: '#1565c0',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0d47a1')}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#1565c0')}
                        >
                            ★ Berita Acara
                        </button>
                        <button
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                background: '#fab005',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#f59f00')}
                            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#fab005')}
                        >
                            Perbarui Berita
                        </button>
                    </div>
                </div>

                {/* ── Right panel: banner sejajar panel ── */}
                <div
                    style={{
                        flex: 1,
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #fff8e1 0%, #ffe082 100%)',
                    }}
                >
                    <img
                        src={asset('/Image/Home/IMG-H01.png')}
                        alt="Banner Pemberitahuan"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                </div>
            </div>
        </section>
    );
}
