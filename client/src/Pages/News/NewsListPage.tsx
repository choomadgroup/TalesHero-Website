import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    allArticles,
    CATEGORY_LABELS,
    CATEGORY_COLORS,
    formatDate,
    type NewsCategory,
} from '@/Lib/newsLoader';
import { HiSearch, HiClock, HiChevronRight } from 'react-icons/hi';
import { MdUpdate, MdInfoOutline, MdBuildCircle, MdGridView } from 'react-icons/md';

const CATEGORY_ICONS: Record<NewsCategory | 'all', React.ReactNode> = {
    all:         <MdGridView size={13} />,
    update:      <MdUpdate size={13} />,
    info:        <MdInfoOutline size={13} />,
    maintenance: <MdBuildCircle size={13} />,
};

const FILTERS = [
    { value: 'all',         label: 'Semua' },
    { value: 'update',      label: 'Update' },
    { value: 'info',        label: 'Info' },
    { value: 'maintenance', label: 'Maintenance' },
] as const;

/* ── card helpers ── */
function CoverImg({ src, alt, readTime }: { src?: string; alt: string; readTime?: number }) {
    return (
        <div className="nc-img">
            {src
                ? <img src={src} alt={alt} />
                : <div className="nc-img__placeholder" />
            }
            {readTime && (
                <span className="nc-img__time">
                    <HiClock size={11} />
                    {readTime} menit baca
                </span>
            )}
        </div>
    );
}

export default function NewsListPage() {
    usePageMeta({
        title: 'News — Tales Hero Indonesia',
        description: 'Update terbaru, informasi, dan jadwal maintenance server Tales Hero Indonesia.',
    });

    const [, setLocation] = useLocation();
    const [active, setActive] = useState<NewsCategory | 'all'>('all');
    const [query,  setQuery]  = useState('');

    const filtered = useMemo(() => {
        let list = active === 'all' ? allArticles : allArticles.filter(a => a.category === active);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.excerpt.toLowerCase().includes(q),
            );
        }
        return list;
    }, [active, query]);

    const [featured, ...rest] = filtered;
    const go = (cat: string, slug: string) => setLocation(`/news/${cat}/${slug}`);

    return (
        <>
            <Header light />

            <div className="nl-page">

                {/* ── Header ── */}
                <div className="nl-header">
                    <span className="nl-header__badge">
                        <MdGridView size={12} /> News
                    </span>
                    <h1 className="nl-header__title">Berita &amp; Pengumuman</h1>
                    <p className="nl-header__desc">
                        Update terbaru, informasi server, dan jadwal maintenance Tales Hero Indonesia.
                    </p>

                    <div className="nl-search">
                        <HiSearch className="nl-search__icon" size={16} />
                        <input
                            className="nl-search__input"
                            type="text"
                            placeholder="Cari artikel..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="nl-filters">
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                className={`nl-filters__pill ${active === f.value ? 'nl-filters__pill--active' : ''}`}
                                onClick={() => setActive(f.value as NewsCategory | 'all')}
                            >
                                {CATEGORY_ICONS[f.value]}
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="nl-content">

                    {filtered.length === 0 && (
                        <p className="nl-empty">Tidak ada artikel yang ditemukan.</p>
                    )}

                    {/* ── Featured ── */}
                    {featured && (
                        <button className="nc-featured" onClick={() => go(featured.category, featured.slug)}>
                            <CoverImg src={featured.cover} alt={featured.title} readTime={featured.readTime} />
                            <div className="nc-featured__body">
                                <span
                                    className="nc-cat"
                                    style={{ color: CATEGORY_COLORS[featured.category] }}
                                >
                                    {CATEGORY_ICONS[featured.category]}
                                    {CATEGORY_LABELS[featured.category]}
                                </span>
                                <h2 className="nc-featured__title">{featured.title}</h2>
                                {featured.excerpt && (
                                    <p className="nc-featured__excerpt">{featured.excerpt}</p>
                                )}
                                <div className="nc-featured__footer">
                                    <time className="nc-date">{formatDate(featured.date)}</time>
                                    <span className="nc-readmore">
                                        Baca selengkapnya <HiChevronRight size={14} />
                                    </span>
                                </div>
                            </div>
                        </button>
                    )}

                    {/* ── Grid ── */}
                    {rest.length > 0 && (
                        <>
                            <div className="nl-divider">
                                <span>Artikel Lainnya</span>
                            </div>
                            <ul className="nl-grid">
                                {rest.map(a => (
                                    <li key={`${a.category}/${a.slug}`}>
                                        <button className="nc-card" onClick={() => go(a.category, a.slug)}>
                                            <CoverImg src={a.cover} alt={a.title} readTime={a.readTime} />
                                            <div className="nc-card__body">
                                                <span
                                                    className="nc-cat"
                                                    style={{ color: CATEGORY_COLORS[a.category] }}
                                                >
                                                    {CATEGORY_ICONS[a.category]}
                                                    {CATEGORY_LABELS[a.category]}
                                                </span>
                                                <h3 className="nc-card__title">{a.title}</h3>
                                                {a.excerpt && (
                                                    <p className="nc-card__excerpt">{a.excerpt}</p>
                                                )}
                                                <div className="nc-card__footer">
                                                    <time className="nc-date">{formatDate(a.date)}</time>
                                                    <span className="nc-readmore">
                                                        Baca selengkapnya <HiChevronRight size={13} />
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>

            <Footer />
        </>
    );
}
