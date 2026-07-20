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
import { HiSearch } from 'react-icons/hi';
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

export default function NewsListPage() {
    usePageMeta({
        title: 'News — Tales Hero Indonesia',
        description: 'Update terbaru, informasi, dan jadwal maintenance server Tales Hero Indonesia.',
    });

    const [, setLocation] = useLocation();
    const [active, setActive]   = useState<NewsCategory | 'all'>('all');
    const [query,  setQuery]    = useState('');

    const filtered = useMemo(() => {
        let list = active === 'all' ? allArticles : allArticles.filter(a => a.category === active);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.excerpt.toLowerCase().includes(q)
            );
        }
        return list;
    }, [active, query]);

    const [featured, ...rest] = filtered;

    const go = (category: string, slug: string) =>
        setLocation(`/news/${category}/${slug}`);

    return (
        <>
            <Header light />

            <div className="nl-page">

                {/* ── Page header ── */}
                <div className="nl-header">
                    <span className="nl-header__badge">
                        <MdGridView size={12} />
                        News
                    </span>
                    <h1 className="nl-header__title">Berita &amp; Pengumuman</h1>
                    <p className="nl-header__desc">
                        Update terbaru, informasi server, dan jadwal maintenance Tales Hero Indonesia.
                    </p>

                    {/* Search */}
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

                    {/* Filter pills */}
                    <div className="nl-filters">
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                className={`nl-filters__pill ${active === f.value ? 'nl-filters__pill--active' : ''}`}
                                style={active === f.value && f.value !== 'all'
                                    ? { '--pill-color': CATEGORY_COLORS[f.value as NewsCategory] } as React.CSSProperties
                                    : undefined}
                                onClick={() => setActive(f.value as NewsCategory | 'all')}
                            >
                                {CATEGORY_ICONS[f.value]}
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="nl-content">

                    {filtered.length === 0 && (
                        <div className="nl-empty">
                            <p>Tidak ada artikel yang ditemukan.</p>
                        </div>
                    )}

                    {/* Featured — first article, full-width */}
                    {featured && (
                        <button
                            className="nl-featured"
                            onClick={() => go(featured.category, featured.slug)}
                        >
                            <div className="nl-featured__img">
                                {featured.cover
                                    ? <img src={featured.cover} alt={featured.title} />
                                    : <div className="nl-featured__img-placeholder" />
                                }
                            </div>
                            <div className="nl-featured__body">
                                <span
                                    className="nl-badge"
                                    style={{ '--badge-color': CATEGORY_COLORS[featured.category] } as React.CSSProperties}
                                >
                                    {CATEGORY_ICONS[featured.category]}
                                    {CATEGORY_LABELS[featured.category]}
                                </span>
                                <h2 className="nl-featured__title">{featured.title}</h2>
                                {featured.excerpt && (
                                    <p className="nl-featured__excerpt">{featured.excerpt}</p>
                                )}
                                <time className="nl-featured__date">{formatDate(featured.date)}</time>
                            </div>
                        </button>
                    )}

                    {/* Grid — remaining articles */}
                    {rest.length > 0 && (
                        <ul className="nl-grid">
                            {rest.map(a => (
                                <li key={`${a.category}/${a.slug}`}>
                                    <button
                                        className="nl-card"
                                        onClick={() => go(a.category, a.slug)}
                                    >
                                        <div className="nl-card__img">
                                            {a.cover
                                                ? <img src={a.cover} alt={a.title} />
                                                : <div className="nl-card__img-placeholder" />
                                            }
                                        </div>
                                        <div className="nl-card__body">
                                            <span
                                                className="nl-badge"
                                                style={{ '--badge-color': CATEGORY_COLORS[a.category] } as React.CSSProperties}
                                            >
                                                {CATEGORY_ICONS[a.category]}
                                                {CATEGORY_LABELS[a.category]}
                                            </span>
                                            <h3 className="nl-card__title">{a.title}</h3>
                                            {a.excerpt && (
                                                <p className="nl-card__excerpt">{a.excerpt}</p>
                                            )}
                                            <time className="nl-card__date">{formatDate(a.date)}</time>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <Footer />
        </>
    );
}
