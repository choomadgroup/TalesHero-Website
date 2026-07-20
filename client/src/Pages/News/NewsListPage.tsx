import { useState } from 'react';
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
import { HiChevronRight, HiNewspaper } from 'react-icons/hi';
import { MdUpdate, MdInfoOutline, MdBuildCircle } from 'react-icons/md';

const CATEGORY_ICONS: Record<NewsCategory | 'all', React.ReactNode> = {
    all:         <HiNewspaper size={15} />,
    update:      <MdUpdate size={15} />,
    info:        <MdInfoOutline size={15} />,
    maintenance: <MdBuildCircle size={15} />,
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
    const [active, setActive] = useState<NewsCategory | 'all'>('all');

    const filtered = active === 'all'
        ? allArticles
        : allArticles.filter(a => a.category === active);

    return (
        <>
            <Header light />

            <div className="news-page">
                {/* ── Page header ── */}
                <div className="news-page__hero">
                    <div className="news-page__hero-inner">
                        <span className="news-page__hero-eyebrow">
                            <HiNewspaper size={16} />
                            Berita &amp; Pengumuman
                        </span>
                        <h1 className="news-page__hero-title">News</h1>
                        <p className="news-page__hero-desc">
                            Update terbaru, informasi server, dan jadwal maintenance Tales Hero Indonesia.
                        </p>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="news-page__content">

                    {/* Filter tabs */}
                    <div className="news-filter">
                        {FILTERS.map(f => (
                            <button
                                key={f.value}
                                className={`news-filter__tab ${active === f.value ? 'news-filter__tab--active' : ''}`}
                                onClick={() => setActive(f.value as NewsCategory | 'all')}
                            >
                                <span className="news-filter__icon">{CATEGORY_ICONS[f.value]}</span>
                                {f.label}
                                <span className="news-filter__count">
                                    {f.value === 'all'
                                        ? allArticles.length
                                        : allArticles.filter(a => a.category === f.value).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Article list */}
                    {filtered.length === 0 ? (
                        <div className="news-empty">
                            <HiNewspaper size={40} />
                            <p>Belum ada artikel di kategori ini.</p>
                        </div>
                    ) : (
                        <ul className="news-list">
                            {filtered.map(article => (
                                <li key={`${article.category}/${article.slug}`} className="news-card">
                                    {/* Cover thumbnail */}
                                    {article.cover && (
                                        <button
                                            className="news-card__cover"
                                            onClick={() => setLocation(`/news/${article.category}/${article.slug}`)}
                                            tabIndex={-1}
                                        >
                                            <img src={article.cover} alt={article.title} />
                                        </button>
                                    )}

                                    <div className="news-card__body">
                                        <div className="news-card__meta">
                                            <span
                                                className="news-card__badge"
                                                style={{ '--badge-color': CATEGORY_COLORS[article.category] } as React.CSSProperties}
                                            >
                                                {CATEGORY_ICONS[article.category]}
                                                {CATEGORY_LABELS[article.category]}
                                            </span>
                                            <time className="news-card__date">{formatDate(article.date)}</time>
                                        </div>
                                        <h2 className="news-card__title">
                                            <button onClick={() => setLocation(`/news/${article.category}/${article.slug}`)}>
                                                {article.title}
                                            </button>
                                        </h2>
                                        {article.excerpt && (
                                            <p className="news-card__excerpt">{article.excerpt}</p>
                                        )}
                                        <button
                                            className="news-card__readmore"
                                            onClick={() => setLocation(`/news/${article.category}/${article.slug}`)}
                                        >
                                            Baca selengkapnya
                                            <HiChevronRight size={15} />
                                        </button>
                                    </div>
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
