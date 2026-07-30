import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { useApiNews, type ApiNewsArticle } from '@/Hooks/use-news';
import { CATEGORY_LABELS, CATEGORY_COLORS, type NewsCategory } from '@/Lib/newsLoader';
import { formatDate } from '@/Lib/markdown';
import { HiSearch, HiClock, HiChevronRight, HiX } from 'react-icons/hi';
import { MdUpdate, MdInfoOutline, MdBuildCircle, MdGridView } from 'react-icons/md';
import { BsNewspaper } from 'react-icons/bs';

const CATEGORY_ICONS: Record<NewsCategory, React.ReactNode> = {
    update:      <MdUpdate size={13} />,
    info:        <MdInfoOutline size={13} />,
    maintenance: <MdBuildCircle size={13} />,
};

const fadeUp = {
    hidden: { opacity: 0, y: 22 },
    show:   { opacity: 1, y: 0  },
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <li>
            <div className="nc-card" style={{ cursor: 'default', pointerEvents: 'none' }}>
                <div className="nc-card__img">
                    <div className="nc-card__img-placeholder" style={{ opacity: 0.5 }} />
                </div>
                <div className="nc-card__body">
                    <div style={{ height: 12, width: '60%', borderRadius: 6, background: 'rgba(0,0,0,0.07)', marginBottom: 10 }} />
                    <div style={{ height: 20, width: '85%', borderRadius: 6, background: 'rgba(0,0,0,0.07)', marginBottom: 8 }} />
                    <div style={{ height: 13, width: '100%', borderRadius: 6, background: 'rgba(0,0,0,0.05)', marginBottom: 6 }} />
                    <div style={{ height: 13, width: '75%', borderRadius: 6, background: 'rgba(0,0,0,0.05)' }} />
                </div>
            </div>
        </li>
    );
}

// ── Featured top card ─────────────────────────────────────────────────────────
function FeaturedCard({ a, onClick }: { a: ApiNewsArticle; onClick: () => void }) {
    const badgeColor = CATEGORY_COLORS[a.category as NewsCategory] ?? '#fab005';
    return (
        <motion.div
            className="nc-featured"
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.5, delay: 0.06 }}
            onClick={onClick}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onClick()}
        >
            {a.coverUrl
                ? <img className="nc-featured__bg" src={a.coverUrl} alt={a.title} />
                : <div className="nc-featured__bg-placeholder" />
            }
            <div className="nc-featured__overlay" />

            <div className="nc-featured__top-left">
                <span className="nc-featured__badge"
                    style={{ borderColor: `${badgeColor}55`, color: badgeColor }}>
                    {CATEGORY_ICONS[a.category as NewsCategory]}
                    {CATEGORY_LABELS[a.category as NewsCategory] ?? a.category}
                </span>
            </div>
            {a.readTime && (
                <div className="nc-featured__top-right">
                    <span className="nc-featured__time"><HiClock size={11} /> {a.readTime} mnt</span>
                </div>
            )}

            <div className="nc-featured__body">
                <h2 className="nc-featured__title">{a.title}</h2>
                {a.excerpt && <p className="nc-featured__excerpt">{a.excerpt}</p>}
                <div className="nc-featured__footer">
                    <span className="nc-featured__date">{formatDate(a.publishedAt ?? a.createdAt)}</span>
                    <span className="nc-featured__readmore">Baca Selengkapnya <HiChevronRight size={14} /></span>
                </div>
            </div>
        </motion.div>
    );
}

// ── Grid article card ─────────────────────────────────────────────────────────
function ArticleCard({ a, idx, onClick }: { a: ApiNewsArticle; idx: number; onClick: () => void }) {
    const badgeColor = CATEGORY_COLORS[a.category as NewsCategory] ?? '#fab005';
    return (
        <motion.li
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.42, delay: idx * 0.07 }}
        >
            <article
                className="nc-card"
                onClick={onClick}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onClick()}
            >
                <div className="nc-card__img">
                    {a.coverUrl
                        ? <img src={a.coverUrl} alt={a.title} loading="lazy" />
                        : <div className="nc-card__img-placeholder" />
                    }
                    {a.readTime && (
                        <span className="nc-card__time">
                            <HiClock size={10} /> {a.readTime} mnt
                        </span>
                    )}
                </div>
                <div className="nc-card__body">
                    <h3 className="nc-card__title">{a.title}</h3>
                    {a.excerpt && <p className="nc-card__excerpt">{a.excerpt}</p>}
                    <div className="nc-card__footer">
                        <span className="nc-cat-badge nc-cat-badge--sm"
                            style={{ '--badge-color': badgeColor } as React.CSSProperties}>
                            {CATEGORY_ICONS[a.category as NewsCategory]}
                            {CATEGORY_LABELS[a.category as NewsCategory] ?? a.category}
                        </span>
                        <span className="nc-card__readmore">
                            Selengkapnya <HiChevronRight size={13} />
                        </span>
                    </div>
                </div>
            </article>
        </motion.li>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewsListPage() {
    usePageMeta({
        title: 'News — Tales Hero Indonesia',
        description: 'Semua berita Update terbaru, informasi, dan jadwal maintenance server Tales Hero Indonesia.',
    });

    const [, setLocation] = useLocation();
    const [query, setQuery]               = useState('');
    const [activeCategory, setActiveCat] = useState<NewsCategory | null>(null);

    const { articles, loading } = useApiNews();

    const go = (cat: string, slug: string) => setLocation(`/news/${cat}/${slug}`);

    const filtered = useMemo(() => {
        let result = articles;
        if (activeCategory) result = result.filter(a => a.category === activeCategory);
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(a =>
                a.title.toLowerCase().includes(q) || (a.excerpt ?? '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [articles, activeCategory, query]);

    const categoryCounts = useMemo(() => {
        const counts: Partial<Record<NewsCategory, number>> = {};
        articles.forEach(a => {
            const cat = a.category as NewsCategory;
            counts[cat] = (counts[cat] ?? 0) + 1;
        });
        return counts;
    }, [articles]);

    const [featured, ...rest] = filtered;

    return (
        <div className="nl-root">
            <Header light />

            {/* Hero */}
            <section className="guides-hero guides-hero--tall"
                style={{ backgroundImage: "url('/Image/Header/IMG-HR-03.png')" }}>
                <div className="guides-hero__inner">
                    <div className="guides-hero__badge">
                        <MdGridView size={14} /> News
                    </div>
                    <h1 className="guides-hero__title">Berita &amp; Pengumuman</h1>
                    <p className="guides-hero__sub">
                        Semua informasi tentang Tales Hero Indonesia akan diberitahukan dan ditampilkan di halaman ini.
                    </p>
                </div>
            </section>

            <div className="nl-page">
                <main className="nl-main">
                    {/* Search */}
                    <motion.div className="nl-search-wrap"
                        variants={fadeUp} initial="hidden" animate="show"
                        transition={{ duration: 0.45, delay: 0.08 }}>
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
                                <button className="nl-search__clear"
                                    onClick={() => setQuery('')} aria-label="Hapus pencarian">
                                    <HiX size={14} />
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Category filters */}
                    <motion.div className="nl-filters"
                        variants={fadeUp} initial="hidden" animate="show"
                        transition={{ duration: 0.45, delay: 0.14 }}>
                        <button
                            className={`nl-filter-pill${!activeCategory ? ' nl-filter-pill--active' : ''}`}
                            onClick={() => setActiveCat(null)}>
                            Semua
                            <span className="nl-filter-pill__count">{articles.length}</span>
                        </button>
                        {(Object.entries(CATEGORY_LABELS) as [NewsCategory, string][]).map(([cat, label]) => (
                            <button key={cat}
                                className={`nl-filter-pill${activeCategory === cat ? ' nl-filter-pill--active' : ''}`}
                                onClick={() => setActiveCat(activeCategory === cat ? null : cat)}
                                style={{ '--cat-color': CATEGORY_COLORS[cat] } as React.CSSProperties}>
                                {CATEGORY_ICONS[cat]} {label}
                                <span className="nl-filter-pill__count">{categoryCounts[cat] ?? 0}</span>
                            </button>
                        ))}
                    </motion.div>

                    {/* Content */}
                    <div className="nl-content">
                        {loading && (
                            <ul className="nl-grid">
                                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                            </ul>
                        )}

                        {!loading && filtered.length === 0 && (
                            <motion.div className="nl-empty"
                                variants={fadeUp} initial="hidden" animate="show">
                                <div className="nl-empty__icon"><BsNewspaper size={28} /></div>
                                <p className="nl-empty__title">
                                    {articles.length === 0 ? 'Belum ada artikel' : 'Tidak ada hasil ditemukan'}
                                </p>
                                <p className="nl-empty__hint">
                                    {articles.length === 0
                                        ? 'Artikel akan muncul di sini setelah ditambahkan dari admin panel.'
                                        : 'Coba kata kunci atau kategori yang berbeda.'}
                                </p>
                                {(query || activeCategory) && (
                                    <button className="nl-empty__reset"
                                        onClick={() => { setQuery(''); setActiveCat(null); }}>
                                        Hapus filter
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {!loading && filtered.length > 0 && (
                            <>
                                {/* Featured (first article) */}
                                {featured && (
                                    <FeaturedCard a={featured}
                                        onClick={() => go(featured.category, featured.slug)} />
                                )}

                                {/* Grid of remaining articles */}
                                {rest.length > 0 && (
                                    <>
                                        <div className="nl-divider">Artikel Lainnya</div>
                                        <ul className="nl-grid">
                                            {rest.map((a, i) => (
                                                <ArticleCard key={a._id} a={a} idx={i}
                                                    onClick={() => go(a.category, a.slug)} />
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
}
