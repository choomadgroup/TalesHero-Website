import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiSwordman } from 'react-icons/gi';
import { IoClose, IoSearch } from 'react-icons/io5';
import { RUNNERS, STORIES, type Character } from '../../Data/Characters';

// ─── Image Helpers ────────────────────────────────────────────────────────────

function avatarSrc(name: string): string {
  return `/Image/Karakter/Avatar/${encodeURIComponent(name)}.png`;
}

function artSrc(name: string): string {
  return `/Image/Karakter/Art/${encodeURIComponent(name)}.png`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pick a card color theme based on the character's dominant stat */
function cardTheme(c: Character): { bg: string; accent: string; label: string } {
    const max = Math.max(c.acceleration, c.maximumSpeed, c.power, c.control);
    if (max === c.power && c.power >= 5)
        return { bg: 'linear-gradient(160deg,#7f1d1d,#dc2626)', accent: '#fca5a5', label: 'Kekuatan' };
    if (max === c.maximumSpeed && c.maximumSpeed >= 5)
        return { bg: 'linear-gradient(160deg,#1e3a8a,#2563eb)', accent: '#93c5fd', label: 'Kecepatan' };
    if (max === c.acceleration && c.acceleration >= 5)
        return { bg: 'linear-gradient(160deg,#14532d,#16a34a)', accent: '#86efac', label: 'Akselerasi' };
    if (max === c.control && c.control >= 5)
        return { bg: 'linear-gradient(160deg,#4c1d95,#7c3aed)', accent: '#c4b5fd', label: 'Kontrol' };
    return { bg: 'linear-gradient(160deg,#78350f,#d97706)', accent: '#fde68a', label: 'Seimbang' };
}

/** Mini stat bar — 6 segments */
function StatBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="char-card__bar-track">
            {Array.from({ length: 6 }, (_, i) => (
                <div
                    key={i}
                    className="char-card__bar-seg"
                    style={{ background: i < value ? color : 'rgba(255,255,255,0.15)' }}
                />
            ))}
        </div>
    );
}

// ─── Diamond Chart ────────────────────────────────────────────────────────────

function DiamondChart({ speed, acceleration, power, control }: {
    speed: number; acceleration: number; power: number; control: number;
}) {
    const cx = 110, cy = 110, r = 80;
    const s = (v: number) => v / 6;
    const gridPts = (f: number) =>
        `${cx},${cy - r * f} ${cx + r * f},${cy} ${cx},${cy + r * f} ${cx - r * f},${cy}`;
    const statPts = `${cx},${cy - r * s(speed)} ${cx + r * s(power)},${cy} ${cx},${cy + r * s(control)} ${cx - r * s(acceleration)},${cy}`;
    return (
        <svg viewBox="0 0 220 220" width="180" height="180" className="char-chart-svg">
            <defs>
                <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2FB5FF" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#fab005" stopOpacity="0.5" />
                </linearGradient>
            </defs>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((f, i) => (
                <polygon key={i} points={gridPts(f)} fill="none" stroke="#D1D5DB" strokeWidth="1" />
            ))}
            <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#D1D5DB" strokeWidth="1" />
            <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#D1D5DB" strokeWidth="1" />
            <polygon points={statPts} fill="url(#dg)" stroke="#2FB5FF" strokeWidth="2" />
            <circle cx={cx} cy={cy} r={3} fill="#fab005" />
        </svg>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function CharacterModal({ char, onClose }: { char: Character | null; onClose: () => void }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    useEffect(() => {
        if (char) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [char]);

    if (!char) return null;

    const { bg, accent } = cardTheme(char);

    const motionRows = [
        { label: 'Waktu Respawn', value: char.revivalMotion, note: '1' },
        { label: 'Waktu terjadi saat menabrak rintangan', value: char.hurdleMotion, note: '3' },
        { label: 'Waktu terjadi jika dash pendaratan gagal', value: char.landingMotion, note: '1' },
        { label: 'Waktu Transformasi Kemarahan', value: char.angryMotion, note: null },
        { label: 'Waktu Transformasi Kemarahan Saat Berenang', value: char.swimmingMotion, note: null },
        { label: 'Waktu sarang', value: char.beehiveMotion, note: null },
        { label: 'Waktu sengatan listrik', value: char.electricShockMotion, note: '2' },
        { label: 'Waktu setrum saat kepala diinjak', value: char.stunMotion, note: '1' },
    ];

    return (
        <div className="char-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="char-modal" onClick={e => e.stopPropagation()}>
                <button className="char-modal__close" onClick={onClose} aria-label="Tutup">
                    <IoClose size={22} />
                </button>

                {/* Header — original light design */}
                <div className="char-modal__header">
                    <span className="char-modal__catchphrase">{char.catchPhrase}</span>
                    <h2 className="char-modal__name">{char.characterNm}</h2>
                    <p className="char-modal__comments">{char.comments}</p>
                </div>

                {/* Body */}
                <div className="char-modal__body">
                    {/* Left — unique ability + motion table */}
                    <div className="char-modal__left">
                        <div className="char-modal__section">
                            <h3 className="char-modal__section-title">Statistik Eksklusif</h3>
                            <div className="char-modal__exclusive">
                                <p>{char.uniqueAbility}</p>
                                {char.uniqueAbilityBalance && (
                                    <>
                                        <p className="char-modal__balance-lbl">[Koreksi Keseimbangan]</p>
                                        <p>{char.uniqueAbilityBalance}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="char-modal__section">
                            <h3 className="char-modal__section-title">Waktu gerak karakter</h3>
                            <table className="char-modal__table">
                                <thead>
                                    <tr><th>Kategori</th><th>Waktu (detik)</th></tr>
                                </thead>
                                <tbody>
                                    {motionRows.map((row, i) => (
                                        <tr key={i}>
                                            <td>{row.label}{row.note && <sup>{row.note}</sup>}</td>
                                            <td>{row.value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="char-modal__footnotes">
                            <p><sup>1</sup> Regenerasi 50% lebih cepat tergantung pada peringkat</p>
                            <p><sup>2</sup> Pemutaran 50% lebih cepat tergantung pada arah kiri/kanan</p>
                            <p><sup>3</sup> Bervariasi tergantung lingkungan aktual (rintangan, hitbox, dll.)</p>
                        </div>
                    </div>

                    {/* Center — diamond chart + full body art below */}
                    <div className="char-modal__center">
                        <div className="char-modal__chart">
                            <div className="char-modal__chart-top">
                                <span>Kecepatan</span>
                                <strong>{char.maximumSpeed}</strong>
                            </div>
                            <div className="char-modal__chart-mid">
                                <div className="char-modal__chart-side">
                                    <span>Akselerasi</span>
                                    <strong>{char.acceleration}</strong>
                                </div>
                                <DiamondChart
                                    speed={char.maximumSpeed}
                                    acceleration={char.acceleration}
                                    power={char.power}
                                    control={char.control}
                                />
                                <div className="char-modal__chart-side char-modal__chart-side--right">
                                    <span>Kekuatan</span>
                                    <strong>{char.power}</strong>
                                </div>
                            </div>
                            <div className="char-modal__chart-bottom">
                                <span>Kontrol</span>
                                <strong>{char.control}</strong>
                            </div>
                        </div>
                        <img
                            src={artSrc(char.characterNm)}
                            alt={`${char.characterNm} full art`}
                            className="char-modal__art"
                        />
                    </div>

                    {/* Right — profile */}
                    <div className="char-modal__right">
                        <h3 className="char-modal__section-title" style={{ padding: '28px 20px 0' }}>Profil</h3>
                        <table className="char-modal__profile">
                            <tbody>
                                <tr><td>Usia</td><td>{char.ageInfo}</td></tr>
                                <tr><td>Tinggi</td><td>{char.height}</td></tr>
                                <tr><td>Berat</td><td>{char.weight}</td></tr>
                                <tr><td>MBTI</td><td>{char.mbti}</td></tr>
                                <tr><td>Gol. Darah</td><td>{char.bloodType}</td></tr>
                                <tr><td>Pekerjaan</td><td>{char.job}</td></tr>
                                <tr><td>Ulang tahun</td><td>{char.birthDayInfo}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Character Card ───────────────────────────────────────────────────────────

function CharCard({ char, onClick }: { char: Character; onClick: () => void }) {
    const { bg, accent } = cardTheme(char);
    return (
        <button className="char-card" onClick={onClick} style={{ background: bg }}>
            <span className="char-card__badge">
                {char.category === 0 ? 'Pelari' : 'Cerita'}
            </span>

            {/* Avatar image */}
            <div className="char-card__avatar-wrap">
                <img
                    src={avatarSrc(char.characterNm)}
                    alt={char.characterNm}
                    className="char-card__avatar"
                    loading="lazy"
                />
            </div>

            <div className="char-card__body">
                <p className="char-card__name">{char.characterNm}</p>
                <p className="char-card__catch">{char.catchPhrase}</p>
            </div>
            <div className="char-card__stats">
                <div className="char-card__stat-row">
                    <span>SPD</span>
                    <StatBar value={char.maximumSpeed} color={accent} />
                    <span>{char.maximumSpeed}</span>
                </div>
                <div className="char-card__stat-row">
                    <span>ACC</span>
                    <StatBar value={char.acceleration} color={accent} />
                    <span>{char.acceleration}</span>
                </div>
                <div className="char-card__stat-row">
                    <span>PWR</span>
                    <StatBar value={char.power} color={accent} />
                    <span>{char.power}</span>
                </div>
                <div className="char-card__stat-row">
                    <span>CTL</span>
                    <StatBar value={char.control} color={accent} />
                    <span>{char.control}</span>
                </div>
            </div>
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GuidesKarakter() {
    const [, setLocation] = useLocation();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<Character | null>(null);

    useEffect(() => {
        document.title = 'Karakter & Hero — Tales Hero Indonesia';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const openModal = useCallback((c: Character) => setSelected(c), []);
    const closeModal = useCallback(() => setSelected(null), []);

    const filter = (list: Character[]) =>
        query.trim()
            ? list.filter(c =>
                c.characterNm.toLowerCase().includes(query.toLowerCase()) ||
                c.catchPhrase.toLowerCase().includes(query.toLowerCase())
            )
            : list;

    const filteredRunners = filter(RUNNERS);
    const filteredStories = filter(STORIES);

    return (
        <>
            <Header light />

            {/* Hero banner */}
            <section className="guides-hero">
                <div className="guides-hero__inner">
                    <div className="guides-hero__badge">
                        <GiSwordman size={16} />
                        Karakter &amp; Hero
                    </div>
                    <h1 className="guides-hero__title">Karakter &amp; Hero</h1>
                    <p className="guides-hero__sub">
                        Kenali semua karakter Tales Hero — statistik, kemampuan unik, dan latar belakang mereka.
                    </p>
                    <button className="game-cta-btn" onClick={() => setLocation('/daftar')}>
                        <GiCrossedSwords size={16} />
                        Daftar &amp; Main Sekarang
                    </button>
                </div>
            </section>

            {/* Breadcrumb */}
            <div className="guides-breadcrumb">
                <span onClick={() => setLocation('/')} className="guides-breadcrumb__link">Beranda</span>
                <span className="guides-breadcrumb__sep">›</span>
                <span className="guides-breadcrumb__link guides-breadcrumb__link--active">Karakter &amp; Hero</span>
            </div>

            {/* Page content */}
            <main className="char-page">

                {/* Search bar */}
                <div className="char-search-wrap">
                    <IoSearch size={18} className="char-search-icon" />
                    <input
                        className="char-search"
                        type="text"
                        placeholder="Cari karakter atau deskripsi…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && (
                        <button className="char-search-clear" onClick={() => setQuery('')}>
                            <IoClose size={16} />
                        </button>
                    )}
                </div>

                {/* Runner characters */}
                {filteredRunners.length > 0 && (
                    <section className="char-section">
                        <h2 className="char-section__title">
                            Karakter Pelari
                            <span className="char-section__count">{filteredRunners.length}</span>
                        </h2>
                        <div className="char-grid">
                            {filteredRunners.map(c => (
                                <CharCard key={c.id} char={c} onClick={() => openModal(c)} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Story characters */}
                {filteredStories.length > 0 && (
                    <section className="char-section">
                        <h2 className="char-section__title">
                            Karakter Cerita
                            <span className="char-section__tooltip" title="Penampilan tidak berubah meski menggunakan item">ⓘ</span>
                            <span className="char-section__count">{filteredStories.length}</span>
                        </h2>
                        <div className="char-grid">
                            {filteredStories.map(c => (
                                <CharCard key={c.id} char={c} onClick={() => openModal(c)} />
                            ))}
                        </div>
                    </section>
                )}

                {filteredRunners.length === 0 && filteredStories.length === 0 && (
                    <div className="char-empty">
                        Tidak ada karakter yang cocok dengan "<strong>{query}</strong>"
                    </div>
                )}
            </main>

            <CharacterModal char={selected} onClose={closeModal} />
            <Footer />
        </>
    );
}
