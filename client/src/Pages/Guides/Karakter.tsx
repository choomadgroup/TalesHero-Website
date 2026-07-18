import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiSwordman } from 'react-icons/gi';
import { IoClose } from 'react-icons/io5';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CharacterListItem {
    id: number;
    characterNm: string;
    category: number; // 0 = runner, 1 = story
    catchPhrase: string;
    circularImageUrl: string;
    squareImageUrl: string;
    mainImageUrl: string;
    ingameId: number;
}

interface CharacterDetail extends CharacterListItem {
    comments: string;
    acceleration: number;
    maximumSpeed: number;
    power: number;
    control: number;
    uniqueAbility: string;
    uniqueAbilityBalance: string | null;
    revivalMotion: string;
    hurdleMotion: string;
    landingMotion: string;
    angryMotion: string;
    swimmingMotion: string;
    beehiveMotion: string;
    electricShockMotion: string;
    stunMotion: string;
    ageInfo: string;
    height: string;
    weight: string;
    mbti: string;
    bloodType: string;
    job: string;
    birthDayInfo: string;
}

// ─── Diamond Radar Chart ──────────────────────────────────────────────────────

function DiamondChart({ speed, acceleration, power, control }: {
    speed: number; acceleration: number; power: number; control: number;
}) {
    const cx = 110, cy = 110, r = 80;
    const s = (v: number) => v / 6;

    const gridPts = (f: number) =>
        `${cx},${cy - r * f} ${cx + r * f},${cy} ${cx},${cy + r * f} ${cx - r * f},${cy}`;

    const statPts =
        `${cx},${cy - r * s(speed)} ${cx + r * s(power)},${cy} ${cx},${cy + r * s(control)} ${cx - r * s(acceleration)},${cy}`;

    return (
        <svg viewBox="0 0 220 220" width="200" height="200" className="char-chart-svg">
            <defs>
                <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2FB5FF" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#fab005" stopOpacity="0.5" />
                </linearGradient>
            </defs>
            {/* Grid diamonds */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((f, i) => (
                <polygon key={i} points={gridPts(f)} fill="none" stroke="#D1D5DB" strokeWidth="1" />
            ))}
            {/* Axes */}
            <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#D1D5DB" strokeWidth="1" />
            <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#D1D5DB" strokeWidth="1" />
            {/* Stat fill */}
            <polygon points={statPts} fill="url(#diamondGrad)" stroke="#2FB5FF" strokeWidth="2" />
            <circle cx={cx} cy={cy} r={3} fill="#fab005" />
        </svg>
    );
}

// ─── Character Modal ──────────────────────────────────────────────────────────

function CharacterModal({ characterId, onClose }: { characterId: number | null; onClose: () => void }) {
    const [detail, setDetail] = useState<CharacterDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!characterId) return;
        setLoading(true);
        setDetail(null);
        setError(false);
        fetch(`/webb/trintro/character/${characterId}`)
            .then(r => r.json())
            .then(data => {
                setDetail(data.result.info);
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [characterId]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // Lock body scroll
    useEffect(() => {
        if (characterId) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [characterId]);

    if (!characterId) return null;

    const motionRows = detail ? [
        { label: 'Waktu Respawn', value: detail.revivalMotion, note: '1' },
        { label: 'Waktu terjadi saat menabrak rintangan', value: detail.hurdleMotion, note: '3' },
        { label: 'Waktu terjadi jika dash pendaratan gagal', value: detail.landingMotion, note: '1' },
        { label: 'Waktu Transformasi Kemarahan', value: detail.angryMotion, note: null },
        { label: 'Waktu Transformasi Kemarahan Saat Berenang', value: detail.swimmingMotion, note: null },
        { label: 'Waktu sarang', value: detail.beehiveMotion, note: null },
        { label: 'Waktu sengatan listrik', value: detail.electricShockMotion, note: '2' },
        { label: 'Waktu setrum saat kepala diinjak', value: detail.stunMotion, note: '1' },
    ] : [];

    return (
        <div className="char-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="char-modal" onClick={e => e.stopPropagation()}>
                <button className="char-modal__close" onClick={onClose} aria-label="Tutup">
                    <IoClose size={22} />
                </button>

                {loading && (
                    <div className="char-modal__state">
                        <div className="char-modal__spinner" />
                        <p>Memuat data karakter…</p>
                    </div>
                )}

                {error && (
                    <div className="char-modal__state">
                        <p>Gagal memuat data. Coba lagi nanti.</p>
                    </div>
                )}

                {detail && (
                    <>
                        {/* Header */}
                        <div className="char-modal__header">
                            <span className="char-modal__catchphrase">{detail.catchPhrase}</span>
                            <h2 className="char-modal__name">{detail.characterNm}</h2>
                            <p className="char-modal__comments">{detail.comments}</p>
                        </div>

                        {/* Body */}
                        <div className="char-modal__body">
                            {/* Left — stats & motion table */}
                            <div className="char-modal__left">
                                <div className="char-modal__section">
                                    <h3 className="char-modal__section-title">
                                        Statistik Eksklusif
                                    </h3>
                                    <div className="char-modal__exclusive">
                                        <p>{detail.uniqueAbility}</p>
                                        {detail.uniqueAbilityBalance && (
                                            <>
                                                <p className="char-modal__balance-lbl">[Koreksi Keseimbangan]</p>
                                                <p>{detail.uniqueAbilityBalance}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="char-modal__section">
                                    <h3 className="char-modal__section-title">Waktu gerak karakter</h3>
                                    <table className="char-modal__table">
                                        <thead>
                                            <tr>
                                                <th>Kategori</th>
                                                <th>Waktu (detik)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {motionRows.map((row, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        {row.label}
                                                        {row.note && <sup>{row.note}</sup>}
                                                    </td>
                                                    <td>{row.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="char-modal__footnotes">
                                    <p><sup>1</sup> Regenerasi 50% lebih cepat tergantung pada peringkat (hingga peringkat sedang – terendah)</p>
                                    <p><sup>2</sup> Pemutaran 50% lebih cepat tergantung pada pengoperasian tombol arah kiri dan kanan</p>
                                    <p><sup>3</sup> Bervariasi tergantung pada lingkungan aktual (jenis rintangan, hitbox, medan, dll.)</p>
                                </div>
                            </div>

                            {/* Center — character art */}
                            <div className="char-modal__center">
                                <img
                                    src={detail.mainImageUrl}
                                    alt={detail.characterNm}
                                    className="char-modal__art"
                                />
                            </div>

                            {/* Right — radar chart + profile */}
                            <div className="char-modal__right">
                                <div className="char-modal__chart">
                                    <div className="char-modal__chart-top">
                                        <span>Kecepatan Tertinggi</span>
                                        <strong>{detail.maximumSpeed}</strong>
                                    </div>
                                    <div className="char-modal__chart-mid">
                                        <div className="char-modal__chart-side">
                                            <span>Akselerasi</span>
                                            <strong>{detail.acceleration}</strong>
                                        </div>
                                        <DiamondChart
                                            speed={detail.maximumSpeed}
                                            acceleration={detail.acceleration}
                                            power={detail.power}
                                            control={detail.control}
                                        />
                                        <div className="char-modal__chart-side char-modal__chart-side--right">
                                            <span>Kekuatan</span>
                                            <strong>{detail.power}</strong>
                                        </div>
                                    </div>
                                    <div className="char-modal__chart-bottom">
                                        <span>Kontrol</span>
                                        <strong>{detail.control}</strong>
                                    </div>
                                </div>

                                <table className="char-modal__profile">
                                    <tbody>
                                        <tr><td>Usia</td><td>{detail.ageInfo}</td></tr>
                                        <tr><td>Tinggi</td><td>{detail.height}</td></tr>
                                        <tr><td>Berat</td><td>{detail.weight}</td></tr>
                                        <tr>
                                            <td>MBTI / Gol. Darah</td>
                                            <td>{detail.mbti} / {detail.bloodType}</td>
                                        </tr>
                                        <tr><td>Pekerjaan</td><td>{detail.job}</td></tr>
                                        <tr><td>Ulang tahun</td><td>{detail.birthDayInfo}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Character Card ───────────────────────────────────────────────────────────

function CharacterCard({ char, onClick }: { char: CharacterListItem; onClick: () => void }) {
    return (
        <button className="char-card" onClick={onClick}>
            <div className="char-card__circle">
                <img
                    src={char.circularImageUrl}
                    alt={char.characterNm}
                    loading="lazy"
                    className="char-card__img"
                />
            </div>
            <span className="char-card__name">{char.characterNm}</span>
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GuidesKarakter() {
    const [, setLocation] = useLocation();
    const [runners, setRunners] = useState<CharacterListItem[]>([]);
    const [stories, setStories] = useState<CharacterListItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        document.title = 'Karakter & Hero — Tales Hero Indonesia';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        fetch('/webb/trintro/character/all')
            .then(r => r.json())
            .then(data => {
                const list: CharacterListItem[] = data.result.list;
                setRunners(list.filter(c => c.category === 0));
                setStories(list.filter(c => c.category === 1));
                setLoadingList(false);
            })
            .catch(() => setLoadingList(false));
    }, []);

    const openModal = useCallback((id: number) => setSelectedId(id), []);
    const closeModal = useCallback(() => setSelectedId(null), []);

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

            {/* Character grid */}
            <main className="char-page">
                {loadingList ? (
                    <div className="char-page__loading">
                        <div className="char-modal__spinner" />
                        <p>Memuat daftar karakter…</p>
                    </div>
                ) : (
                    <>
                        {/* Runner characters */}
                        {runners.length > 0 && (
                            <section className="char-section">
                                <h2 className="char-section__title">Karakter Pelari</h2>
                                <div className="char-grid">
                                    {runners.map(c => (
                                        <CharacterCard key={c.id} char={c} onClick={() => openModal(c.id)} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Story characters */}
                        {stories.length > 0 && (
                            <section className="char-section">
                                <h2 className="char-section__title">
                                    Karakter Cerita
                                    <span className="char-section__tooltip" title="Karakter cerita adalah karakter khusus dari dunia dongeng. Penampilan tidak berubah meski menggunakan item.">ⓘ</span>
                                </h2>
                                <div className="char-grid">
                                    {stories.map(c => (
                                        <CharacterCard key={c.id} char={c} onClick={() => openModal(c.id)} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            <CharacterModal characterId={selectedId} onClose={closeModal} />

            <Footer />
        </>
    );
}
