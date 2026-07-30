import { useLocation, useParams } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { useApiNewsArticle } from '@/Hooks/use-news';
import { CATEGORY_LABELS, CATEGORY_COLORS, type NewsCategory } from '@/Lib/newsLoader';
import { renderMarkdown, formatDate } from '@/Lib/markdown';
import {
    HiArrowLeft, HiNewspaper, HiCalendar, HiClock, HiGlobe,
} from 'react-icons/hi';
import { HiChevronDown } from 'react-icons/hi';
import { MdUpdate, MdInfoOutline, MdBuildCircle } from 'react-icons/md';

const CATEGORY_ICONS: Record<NewsCategory, React.ReactNode> = {
    update:      <MdUpdate size={13} />,
    info:        <MdInfoOutline size={13} />,
    maintenance: <MdBuildCircle size={13} />,
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function ArticleSkeleton() {
    const bar = (w: string, h: number, mb = 12) => (
        <div style={{ height: h, width: w, borderRadius: 6, background: 'rgba(0,0,0,0.06)', marginBottom: mb }} />
    );
    return (
        <>
            <Header light />
            <div className="news-page">
                <div className="news-article">
                    <div style={{ paddingTop: 8 }}>
                        {bar('40%', 13, 24)}
                        {bar('80%', 32, 14)}
                        {bar('60%', 32, 28)}
                        {bar('30%', 13, 36)}
                        <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', marginBottom: 32 }} />
                        {[...Array(6)].map((_, i) => bar(i % 3 === 2 ? '70%' : '100%', 14, 10))}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NewsArticlePage() {
    const [, setLocation] = useLocation();
    const { category, slug } = useParams<{ category: string; slug: string }>();

    const { article, loading, notFound } = useApiNewsArticle(category ?? '', slug ?? '');

    usePageMeta({
        title: article
            ? `${article.title} — Tales Hero Indonesia`
            : notFound ? 'Artikel Tidak Ditemukan' : 'Memuat… — Tales Hero Indonesia',
        description: article?.excerpt ?? '',
    });

    // Loading skeleton
    if (loading) return <ArticleSkeleton />;

    // Not found
    if (notFound || !article) {
        return (
            <>
                <Header light />
                <div className="news-page">
                    <div className="news-page__content news-notfound">
                        <HiNewspaper size={48} />
                        <h2>Artikel tidak ditemukan</h2>
                        <p>Artikel yang kamu cari tidak ada atau sudah dihapus.</p>
                        <button className="news-back-btn" onClick={() => setLocation('/news')}>
                            <HiArrowLeft size={16} /> Kembali ke News
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const badgeColor = CATEGORY_COLORS[article.category as NewsCategory] ?? '#fab005';

    const handleTranslate = () => {
        const url = `https://translate.google.com/translate?hl=id&sl=id&tl=en&u=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
    };

    return (
        <>
            <Header light />
            <div className="news-page">
                <div className="news-article">
                    {/* Back */}
                    <button className="news-back-link" onClick={() => setLocation('/news')}>
                        <HiArrowLeft size={15} /> Kembali ke News
                    </button>

                    {/* Cover image */}
                    {article.coverUrl && (
                        <div className="news-article__cover">
                            <img src={article.coverUrl} alt={article.title} />
                        </div>
                    )}

                    {/* Header */}
                    <div className="na-header">
                        <span className="na-badge"
                            style={{ '--badge-color': badgeColor } as React.CSSProperties}>
                            {CATEGORY_ICONS[article.category as NewsCategory]}
                            {CATEGORY_LABELS[article.category as NewsCategory] ?? article.category}
                        </span>

                        <h1 className="na-title">{article.title}</h1>

                        {article.excerpt && (
                            <div className="na-excerpt">{article.excerpt}</div>
                        )}

                        <div className="na-meta">
                            <span className="na-meta__item">
                                <HiCalendar size={14} />
                                {formatDate(article.publishedAt ?? article.createdAt)}
                            </span>
                            {article.readTime && (
                                <span className="na-meta__item">
                                    <HiClock size={14} />
                                    {article.readTime} menit baca
                                </span>
                            )}
                            <button className="na-meta__translate" onClick={handleTranslate}>
                                <HiGlobe size={14} /> Terjemahkan <HiChevronDown size={12} />
                            </button>
                        </div>

                        <div className="na-divider" />
                    </div>

                    {/* Markdown content */}
                    <div className="news-prose"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content ?? '') }}
                    />
                </div>
            </div>
            <Footer />
        </>
    );
}
