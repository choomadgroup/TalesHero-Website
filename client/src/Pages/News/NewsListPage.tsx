import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { usePageMeta } from '@/Hooks/use-page-meta';
import {
    allArticles,
    CATEGORY_LABELS,
    CATEGORY_COLORS,
    formatDate,
    type NewsCategory,
} from '@/Lib/newsLoader';
import {
    HiSearch,
    HiClock,
    HiChevronRight,
    HiX,
    HiArrowRight,
} from 'react-icons/hi';
import {
    MdUpdate,
    MdInfoOutline,
    MdBuildCircle,
    MdGridView,
    MdBookmark,
} from 'react-icons/md';
import { BsNewspaper } from 'react-icons/bs';

const CATEGORY_ICONS: Record<NewsCategory, React.ReactNode> = {
    update:      <MdUpdate size={13} />,
    info:        <MdInfoOutline size={13} />,
    maintenance: <MdBuildCircle size={13} />,
};

const fadeUp = {
    hidden: { opacity: 0, y: 22 },
    show:   { opacity: 1, y: 0 },
};

export default function NewsListPage() {
    usePageMeta({
        title: 'News — Tales Hero Indonesia',
        description: 'Update terbaru, informasi, dan jadwal maintenance server Tales Hero Indonesia.',
    });

    const [, setLocation] = useLocation();
    const [query, setQuery]           = useState('');
    const [activeCategory, setActiveCat] = useState<NewsCategory | null>(null);

    const go = (cat: string, slug: string) => setLocation(`/news/${cat}/${slug}`);

    const filtered = useMemo(() => {
        let result = allArticles;
        if (activeCategory) result = result.filter(a => a.category === activeCategory);
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.excerpt.toLowerCase().includes(q),
            );
        }
        return result;
    }, [activeCategory, query]);

    const isFiltering = !!activeCategory || !!query.trim();
    const featuredPost   = isFiltering ? undefined : filtered[0];
    const remainingPosts = isFiltering ? filtered : filtered.slice(1);

    // Category counts (all articles, ignoring search)
    const categoryCounts = useMemo(() => {
        const counts: Partial<Record<NewsCategory, number>> = {};
        allArticles.forEach(a => { counts[a.category] = (counts[a.category] ?? 0) + 1; });
        return counts;
    }, []);

    return (
        <div className="nl-page">
            <main className="nl-main">

                {/* ── Header ── */}
                <motion.header
                    className="nl-header"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    transition={{ duration: 0.55 }}
                >
                    <div className="nl-eyebrow">
                        <MdGridView size={12} />
                        News
                    </div>
                    <h1 className="nl-title">Berita &amp; Pengumuman</h1>
                    <p className="nl-desc">
                        Update terbaru, informasi server, dan jadwal maintenance Tales Hero Indonesia.
                    </p>
                </motion.header>

                {/* ── Search ── */}
                <motion.div
                    className="nl-search-wrap"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    transition={{ duration: 0.45, delay: 0.08 }}
                >
                    <div className="nl-search">
                        <HiSearch className="nl-search__icon" size={16} />
                        <input
                            className="nl-search__input"
                            type="text"
                            placeholder="Cari artikel..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {query && (
                            <button className="nl-search__clear" onClick={() => setQuery('')} aria-label="Hapus pencarian">
                                <HiX size={14} />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* ── Category filters ── */}
                <motion.div
                    className="nl-filters"
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    transition={{ duration: 0.45, delay: 0.14 }}
                >
                    <button
                        className={`nl-filter-pill${!activeCategory ? ' nl-filter-pill--active' : ''}`}
                        onClick={() => setActiveCat(null)}
                    >
                        Semua
                        <span className="nl-filter-pill__count">{allArticles.length}</span>
                    </button>
                    {(Object.entries(CATEGORY_LABELS) as [NewsCategory, string][]).map(([cat, label]) => (
                        <button
                            key={cat}
                            className={`nl-filter-pill${activeCategory === cat ? ' nl-filter-pill--active' : ''}`}
                            onClick={() => setActiveCat(activeCategory === cat ? null : cat)}
                            style={{ '--cat-color': CATEGORY_COLORS[cat] } as React.CSSProperties}
                        >
                            {CATEGORY_ICONS[cat]}
                            {label}
                            <span className="nl-filter-pill__count">{categoryCounts[cat] ?? 0}</span>
                        </button>
                    ))}
                </motion.div>

                {/* ── Content ── */}
                <div className="nl-content">

                    {/* Empty state */}
                    {filtered.length === 0 && (
                        <motion.div
                            className="nl-empty"
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                        >
                            <div className="nl-empty__icon">
                                {isFiltering ? <HiSearch size={28} /> : <BsNewspaper size={28} />}
                            </div>
                            {isFiltering ? (
                                <>
                                    <p className="nl-empty__title">Tidak ada hasil ditemukan</p>
                                    <p className="nl-empty__hint">Coba kata kunci atau kategori yang berbeda.</p>
                                    <button
                                        className="nl-empty__reset"
                                        onClick={() => { setQuery(''); setActiveCat(null); }}
                                    >
                                        Hapus filter
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="nl-empty__title">Belum ada artikel</p>
                                    <p className="nl-empty__hint">Pantau terus untuk update terbaru.</p>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ── Featured post — full overlay ── */}
                    {featuredPost && (
                        <motion.article
                            className="nc-featured"
                            variants={fadeUp}
                            initial="hidden"
                            animate="show"
                            transition={{ duration: 0.55, delay: 0.18 }}
                            onClick={() => go(featuredPost.category, featuredPost.slug)}
                        >
                            {/* Background image */}
                            {featuredPost.cover ? (
                                <img
                                    src={featuredPost.cover}
                                    alt={featuredPost.title}
                                    className="nc-featured__bg"
                                />
                            ) : (
                                <div className="nc-featured__bg-placeholder" />
                            )}

                            {/* Overlay */}
                            <div className="nc-featured__overlay" />

                            {/* Top-left: Featured badge */}
                            <div className="nc-featured__top-left">
                                <span className="nc-featured__badge">
                                    <MdBookmark size={11} /> Featured
                                </span>
                            </div>

                            {/* Top-right: Read time */}
                            {featuredPost.readTime && (
                                <div className="nc-featured__top-right">
                                    <span className="nc-featured__time">
                                        <HiClock size={11} />
                                        {featuredPost.readTime} menit baca
                                    </span>
                                </div>
                            )}

                            {/* Bottom content */}
                            <div className="nc-featured__body">
                                <span
                                    className="nc-cat-badge"
                                    style={{ '--badge-color': CATEGORY_COLORS[featuredPost.category] } as React.CSSProperties}
                                >
                                    {CATEGORY_ICONS[featuredPost.category]}
                                    {CATEGORY_LABELS[featuredPost.category]}
                                </span>
                                <h2 className="nc-featured__title">{featuredPost.title}</h2>
                                {featuredPost.excerpt && (
                                    <p className="nc-featured__excerpt">{featuredPost.excerpt}</p>
                                )}
                                <div className="nc-featured__footer">
                                    <time className="nc-featured__date">{formatDate(featuredPost.date)}</time>
                                    <span className="nc-featured__readmore">
                                        Baca selengkapnya <HiArrowRight size={13} />
                                    </span>
                                </div>
                            </div>
                        </motion.article>
                    )}

                    {/* ── Divider ── */}
                    {!isFiltering && remainingPosts.length > 0 && (
                        <div className="nl-divider"><span>Artikel Lainnya</span></div>
                    )}

                    {/* ── Grid ── */}
                    {remainingPosts.length > 0 && (
                        <ul className="nl-grid">
                            {remainingPosts.map((a, i) => (
                                <motion.li
                                    key={`${a.category}/${a.slug}`}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="show"
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.45, delay: i * 0.06 }}
                                >
                                    <article
                                        className="nc-card"
                                        onClick={() => go(a.category, a.slug)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => e.key === 'Enter' && go(a.category, a.slug)}
                                    >
                                        {/* Card image */}
                                        <div className="nc-card__img">
                                            {a.cover
                                                ? <img src={a.cover} alt={a.title} />
                                                : <div className="nc-card__img-placeholder" />
                                            }
                                            {a.readTime && (
                                                <span className="nc-card__time">
                                                    <HiClock size={10} />
                                                    {a.readTime} mnt
                                                </span>
                                            )}
                                        </div>

                                        {/* Card body */}
                                        <div className="nc-card__body">
                                            <span
                                                className="nc-cat-badge nc-cat-badge--sm"
                                                style={{ '--badge-color': CATEGORY_COLORS[a.category] } as React.CSSProperties}
                                            >
                                                {CATEGORY_ICONS[a.category]}
                                                {CATEGORY_LABELS[a.category]}
                                            </span>
                                            <h3 className="nc-card__title">{a.title}</h3>
                                            {a.excerpt && (
                                                <p className="nc-card__excerpt">{a.excerpt}</p>
                                            )}
                                            <div className="nc-card__footer">
                                                <time className="nc-card__date">{formatDate(a.date)}</time>
                                                <span className="nc-card__readmore">
                                                    Baca <HiChevronRight size={13} />
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}
