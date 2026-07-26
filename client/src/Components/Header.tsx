import { useState, useEffect, useRef } from 'react';
import { asset } from '@/Lib/utils';
import { useLocation } from 'wouter';
import { GiBookmarklet } from 'react-icons/gi';
import { HiMenuAlt3, HiX, HiChevronDown, HiLogin, HiUserAdd, HiDownload, HiQuestionMarkCircle, HiNewspaper } from 'react-icons/hi';
import { MdHeadset, MdHeadsetOff } from 'react-icons/md';
import { IoPersonCircleOutline, IoLogOutOutline } from 'react-icons/io5';
import { useMusic } from '@/Hooks/use-music';
import { useAuth } from '@/Hooks/use-auth';

// Nav links route-based
const NAV_LINKS = [
    { label: 'News',     href: '/news',     icon: <HiNewspaper size={14} /> },
    { label: 'Download', href: '/download', icon: <HiDownload size={14} /> },
    { label: 'Support',  href: '/support',  icon: <HiQuestionMarkCircle size={14} /> },
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
    const [accountOpen, setAccountOpen] = useState(false);
    const [location, setLocation] = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Music (shared context — persists across navigation) ────────
    const { musicOn, toggleMusic } = useMusic();
    // ── Auth ────────────────────────────────────────────────────────
    const { user, logout } = useAuth();
    // ───────────────────────────────────────────────────────────────

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!accountOpen) return;
        const closeOnOutside = (event: MouseEvent) => {
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setAccountOpen(false);
        };
        document.addEventListener('mousedown', closeOnOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('mousedown', closeOnOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [accountOpen]);

    const openDropdown  = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setDropdownOpen(true); };
    const closeDropdown = () => { closeTimer.current = setTimeout(() => setDropdownOpen(false), 120); };

    return (
        <>
            <header className={`game-header ${light ? 'game-header--light' : ''} ${scrolled ? 'game-header--scrolled' : ''}`}>
                <div className="game-header__inner">

                    {/* Logo */}
                    <a href="/" className="game-header__logo">
                        <img
                            src={asset("/Image/tales-hero-banner.png")}
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
                        {NAV_LINKS.map(({ label, href }) => (
                            <span
                                key={href}
                                className="game-nav-link"
                                onClick={() => setLocation(href)}
                            >
                                {label}
                            </span>
                        ))}
                    </nav>

                    {/* CTA + burger */}
                    <div className="game-header__actions">
                        <button
                            className={`game-music-btn ${musicOn ? 'game-music-btn--on' : ''}`}
                            onClick={toggleMusic}
                            aria-label={musicOn ? 'Matikan musik' : 'Nyalakan musik'}
                            title={musicOn ? 'Matikan musik' : 'Nyalakan musik'}
                        >
                            {musicOn ? <MdHeadset size={18} /> : <MdHeadsetOff size={18} />}
                        </button>
                        {user ? (
                            <div className="game-account-menu" ref={accountRef}>
                                <button
                                    className="game-account-avatar-btn"
                                    onClick={() => setAccountOpen(open => !open)}
                                    aria-expanded={accountOpen}
                                    aria-haspopup="menu"
                                    aria-label={`Buka menu akun ${user.username}`}
                                    title={`Halo ${user.username}`}
                                >
                                    <img src={asset('/Image/Account/IMG-DEFAULT-01.png')} alt="" />
                                </button>
                                {accountOpen && (
                                    <div className="game-account-dropdown" role="menu">
                                        <div className="game-account-dropdown__greeting">
                                            <p className="akun-greeting">✦ Halo! Aku ✦</p>
                                            <strong>{user.nickname || "Belum ada nickname"}</strong>
                                        </div>
                                        <button
                                            className="game-account-dropdown__item"
                                            onClick={() => { setLocation('/akun'); setAccountOpen(false); }}
                                            role="menuitem"
                                        >
                                            <IoPersonCircleOutline size={17} />
                                            Info Akun
                                        </button>
                                        <button
                                            className="game-account-dropdown__item game-account-dropdown__item--logout"
                                            onClick={() => { logout(); setLocation('/'); setAccountOpen(false); }}
                                            role="menuitem"
                                        >
                                            <IoLogOutOutline size={17} />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}

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
                            <img src={asset("/Image/tales-hero-banner.png")} alt="Tales Hero" height={36} />
                        </div>

                        <nav className="game-drawer__nav">
                            {/* Nav links */}
                            {NAV_LINKS.map(({ label, href, icon }) => (
                                <button
                                    key={href}
                                    className={`game-drawer__link${location === href ? ' game-drawer__link--active' : ''}`}
                                    onClick={() => { setLocation(href); setOpened(false); }}
                                >
                                    <span className="game-drawer__icon">{icon}</span>
                                    {label}
                                </button>
                            ))}

                            {/* Pengenalan Game di mobile */}
                            <div className="game-drawer__section-label">Pengenalan Game</div>
                            {PENGENALAN_ITEMS.map(item => (
                                <button
                                    key={item.href}
                                    className={`game-drawer__link game-drawer__link--sub${location.startsWith(item.href) ? ' game-drawer__link--active' : ''}`}
                                    onClick={() => { setLocation(item.href); setOpened(false); }}
                                >
                                    <GiBookmarklet size={14} className="game-drawer__icon" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        <div className="game-drawer__footer">
                            {user ? (
                                <>
                                    <button
                                        className="game-login-btn game-login-btn--full"
                                        onClick={() => { setLocation('/akun'); setOpened(false); }}
                                    >
                                        <IoPersonCircleOutline size={16} />
                                        Halo {user.username}
                                    </button>
                                    <button
                                        className="game-login-btn game-login-btn--full"
                                        style={{ opacity: 0.7 }}
                                        onClick={() => { logout(); setLocation('/'); setOpened(false); }}
                                    >
                                        <IoLogOutOutline size={16} />
                                        Keluar
                                    </button>
                                </>
                            ) : (
                                <>
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
                                </>
                            )}
                            <a href="mailto:support@taleshero.web.id" className="game-drawer__email">
                                support@taleshero.web.id
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
