import { useState, useEffect } from 'react';
import { Link } from 'react-scroll';
import { useLocation } from 'wouter';
import { GiCrossedSwords } from 'react-icons/gi';
import { HiMenuAlt3, HiX } from 'react-icons/hi';

const NAV_LINKS = [
    { label: 'Fitur',     to: 'section-one'  },
    { label: 'Game',      to: 'section-four' },
    { label: 'FAQ',       to: 'section-five' },
];

const Header = () => {
    const [opened, setOpened] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [, setLocation] = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <header className={`game-header ${scrolled ? 'game-header--scrolled' : ''}`}>
                <div className="game-header__inner">

                    {/* Logo */}
                    <a href="/" className="game-header__logo">
                        <img
                            src="/Image/tales-hero-banner.png"
                            alt="Tales Hero Indonesia"
                            height={100}
                            style={{ objectFit: 'contain' }}
                        />
                    </a>

                    {/* Desktop nav */}
                    <nav className="game-header__nav">
                        {NAV_LINKS.map(({ label, to }) => (
                            <Link
                                key={to}
                                to={to}
                                smooth
                                duration={500}
                                className="game-nav-link"
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div className="game-header__actions">
                        <button
                            className="game-cta-btn"
                            onClick={() => setLocation('/daftar')}
                        >
                            <GiCrossedSwords size={16} />
                            Main Sekarang
                        </button>

                        {/* Mobile burger */}
                        <button
                            className="game-burger"
                            onClick={() => setOpened(o => !o)}
                            aria-label="Toggle menu"
                        >
                            {opened ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile drawer */}
            {opened && (
                <div className="game-drawer-overlay" onClick={() => setOpened(false)}>
                    <div className="game-drawer" onClick={e => e.stopPropagation()}>
                        <div className="game-drawer__logo">
                            <img src="/Image/tales-hero-banner.png" alt="Tales Hero" height={36} />
                        </div>

                        <nav className="game-drawer__nav">
                            {NAV_LINKS.map(({ label, to }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    smooth
                                    duration={500}
                                    className="game-drawer__link"
                                    onClick={() => setOpened(false)}
                                >
                                    <GiCrossedSwords size={14} className="game-drawer__icon" />
                                    {label}
                                </Link>
                            ))}
                        </nav>

                        <div className="game-drawer__footer">
                            <button
                                className="game-cta-btn game-cta-btn--full"
                                onClick={() => { setLocation('/daftar'); setOpened(false); }}
                            >
                                <GiCrossedSwords size={16} />
                                Mulai Petualangan
                            </button>
                            <a href="mailto:support@taleshero.id" className="game-drawer__email">
                                support@taleshero.id
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
