import { useState } from 'react';
import { Link } from 'react-scroll';
import { useLocation } from 'wouter';

const Header = () => {
    const [opened, setOpened] = useState(false);
    const [, setLocation] = useLocation();

    return (
        <header>
            {/* Desktop nav */}
            <div className="content-desktop">
                <div>
                    <a href="/" style={{ display: 'inline-block' }}>
                        <img
                            src="/Image/tales-hero-banner.png"
                            alt="Tales Hero Indonesia"
                            width={140}
                            height={56}
                            style={{ objectFit: 'contain' }}
                        />
                    </a>
                </div>
                <div className="navbar">
                    <div className="navbar-item"><Link to="section-one" smooth duration={500}>Fitur</Link></div>
                    <div className="navbar-item"><Link to="section-four" smooth duration={500}>Game</Link></div>
                    <div className="navbar-item"><Link to="section-five" smooth duration={500}>FAQ</Link></div>
                    <button className="btn-yellow" onClick={() => setLocation('/daftar')}>Main Sekarang</button>
                </div>
            </div>

            {/* Mobile nav */}
            <div className="content-mobile">
                <div className="burger-button">
                    <button
                        className="burger-icon"
                        onClick={() => setOpened(o => !o)}
                        aria-label={opened ? 'Tutup navigasi' : 'Buka navigasi'}
                    >
                        <span className={`burger-line ${opened ? 'open-1' : ''}`} />
                        <span className={`burger-line ${opened ? 'open-2' : ''}`} />
                        <span className={`burger-line ${opened ? 'open-3' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {opened && (
                <div className="drawer-overlay" onClick={() => setOpened(false)}>
                    <div className="drawer-panel" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <span className="drawer-title">Menu</span>
                            <button className="drawer-close" onClick={() => setOpened(false)}>✕</button>
                        </div>
                        <div className="menu">
                            <div className="menu-items">
                                <div className="menu-item">
                                    <Link to="section-one" smooth duration={500} onClick={() => setOpened(false)}>
                                        <h2 style={{ margin: 0, fontWeight: 700 }}>Fitur</h2>
                                    </Link>
                                </div>
                                <div className="menu-item">
                                    <Link to="section-four" smooth duration={500} onClick={() => setOpened(false)}>
                                        <h2 style={{ margin: 0, fontWeight: 700 }}>Game</h2>
                                    </Link>
                                </div>
                                <div className="menu-item">
                                    <Link to="section-five" smooth duration={500} onClick={() => setOpened(false)}>
                                        <h2 style={{ margin: 0, fontWeight: 700 }}>FAQ</h2>
                                    </Link>
                                </div>
                            </div>

                            <div className="menu-items">
                                <span>Hubungi Kami</span>
                                <a href="mailto:support@taleshero.id" style={{ color: '#fab005' }}>
                                    support@taleshero.id
                                </a>
                            </div>

                            <div className="drawer-card">
                                <div style={{ marginBottom: 8, fontWeight: 600 }}>Tales Hero Indonesia</div>
                                <button
                                    className="drawer-user-btn"
                                    onClick={() => { setLocation('/daftar'); setOpened(false); }}
                                >
                                    <div className="drawer-avatar">THI</div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Tales Hero Indonesia</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>support@taleshero.id</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
