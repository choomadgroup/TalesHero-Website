import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { GiBookmarklet } from 'react-icons/gi';
import { HiMenuAlt3, HiX, HiChevronDown, HiLogin, HiUserAdd, HiDownload, HiSupport } from 'react-icons/hi';

// Nav links route-based
const NAV_LINKS = [
    { label: 'Download', href: '/download', icon: <HiDownload size={15} /> },
    { label: 'Support',  href: '/support',  icon: <HiSupport  size={15} /> },
];

// Item dropdown Pengenalan Game
const PENGENALAN_ITEMS = [
    { label: 'Pengantar',       href: '/guides/pengantar', desc: 'Mulai perjalananmu di Tales Hero' },
    { label: 'Karakter & Hero', href: '/guides/karakter',  desc: 'Kelas hero dan cara memilihnya' },
];

const Header = ({ light = false }: { light?: boolean }) => {
    const [opened, setOpened] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [, setLocation] = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const openDropdown  = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setDropdownOpen(true); };
    const closeDropdown = () => { closeTimer.current = setTimeout(() => setDropdownOpen(false), 120); };

    return (
        <>
            <header className={`game-header ${light ? 'game-header--light' : ''} ${scrolled ? 'game-header--scrolled' : ''}`}>
                <div className="game-header__inner">

                    {/* Logo */}
                    <a href="/" className="game-header__logo">
                        <img
                            src="/Image/tales-hero-banner.png"
                            alt="Tales Hero Indonesia"
                            style={{ objectFit: 'contain' }}
                        />
                    </a>

                    {/* Desktop nav */}
                    <nav className="game-header__nav">

                        {/* Pengenalan Game — dengan dropdown */}
                        <div
                            className="game-nav-dropdown-wrapper"
                            ref={dropdownRef}
                            onMouseEnter={openDropdown}
                            onMouseLeave={closeDropdown}
                        >
                            <span className={`game-nav-link game-nav-link--dropdown ${dropdownOpen ? 'active' : ''}`}>
                                Pengenalan Game
                                <HiChevronDown
                                    size={14}
                                    className={`game-nav-chevron ${dropdownOpen ? 'rotated' : ''}`}
                                />
                            </span>

                            {dropdownOpen && (
                                <div className="game-dropdown-menu">
                                    <div className="game-dropdown-arrow" />
                                    {PENGENALAN_ITEMS.map(item => (
                                        <button
                                            key={item.href}
                                            className="game-dropdown-item"
                                            onClick={() => { setLocation(item.href); setDropdownOpen(false); }}
                                        >
                                            <span className="game-dropdown-item__icon">
                                                <GiBookmarklet size={16} />
                                            </span>
                                            <span className="game-dropdown-item__text">
                                                <span className="game-dropdown-item__label">{item.label}</span>
                                                <span className="game-dropdown-item__desc">{item.desc}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Nav links biasa */}
                        {NAV_LINKS.map(({ label, href, icon }) => (
                            <button
                                key={href}
                                className="game-nav-link game-nav-link--btn"
                                onClick={() => setLocation(href)}
                            >
                                {icon}{label}
                            </button>
                        ))}
                    </nav>

                    {/* CTA + burger */}
                    <div className="game-header__actions">
                        <button
                            className="game-login-btn"
                            onClick={() => setLocation('/login')}
                        >
                            <HiLogin size={16} />
                            Login
                        </button>
                        <button
                            className="game-cta-btn"
                            onClick={() => setLocation('/daftar')}
                        >
                            <HiUserAdd size={16} />
                            Daftar
                        </button>

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
                            {/* Pengenalan Game di mobile */}
                            <div className="game-drawer__section-label">Pengenalan Game</div>
                            {PENGENALAN_ITEMS.map(item => (
                                <button
                                    key={item.href}
                                    className="game-drawer__link game-drawer__link--sub"
                                    onClick={() => { setLocation(item.href); setOpened(false); }}
                                >
                                    <GiBookmarklet size={14} className="game-drawer__icon" />
                                    {item.label}
                                </button>
                            ))}

                            {/* Nav links */}
                            {NAV_LINKS.map(({ label, href, icon }) => (
                                <button
                                    key={href}
                                    className="game-drawer__link"
                                    onClick={() => { setLocation(href); setOpened(false); }}
                                >
                                    <span className="game-drawer__icon">{icon}</span>
                                    {label}
                                </button>
                            ))}
                        </nav>

                        <div className="game-drawer__footer">
                            <button
                                className="game-login-btn game-login-btn--full"
                                onClick={() => { setLocation('/login'); setOpened(false); }}
                            >
                                <HiLogin size={16} />
                                Login
                            </button>
                            <button
                                className="game-cta-btn game-cta-btn--full"
                                onClick={() => { setLocation('/daftar'); setOpened(false); }}
                            >
                                <HiUserAdd size={16} />
                                Daftar
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
