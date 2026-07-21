import { useLocation, useParams } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    getArticle,
    CATEGORY_LABELS,
    CATEGORY_COLORS,
    formatDate,
    type NewsCategory,
} from '@/Lib/newsLoader';
import {
    HiArrowLeft,
    HiNewspaper,
    HiCalendar,
    HiClock,
    HiGlobe,
} from 'react-icons/hi';
import { MdUpdate, MdInfoOutline, MdBuildCircle } from 'react-icons/md';
import { HiChevronDown } from 'react-icons/hi';

const CATEGORY_ICONS: Record<NewsCategory, React.ReactNode> = {
    update:      <MdUpdate size={13} />,
    info:        <MdInfoOutline size={13} />,
    maintenance: <MdBuildCircle size={13} />,
};

export default function NewsArticlePage() {
    const [, setLocation] = useLocation();
    const { category, slug } = useParams<{ category: string; slug: string }>();

    const article = getArticle(category as NewsCategory, slug);

    usePageMeta({
        title: article ? `${article.title} — Tales Hero Indonesia` : 'Artikel Tidak Ditemukan',
        description: article?.excerpt ?? '',
    });

    if (!article) {
        return (
            <>
                <Header light />
                <div className="news-page">
                    <div className="news-page__content news-notfound">
                        <HiNewspaper size={48} />
                        <h2>Artikel tidak ditemukan</h2>
                        <p>Artikel yang kamu cari tidak ada atau sudah dihapus.</p>
                        <button className="news-back-btn" onClick={() => setLocation('/news')}>
                            <HiArrowLeft size={16} />
                            Kembali ke News
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const { component: MDXContent, cover } = article;
    const badgeColor = CATEGORY_COLORS[article.category];

    const handleTranslate = () => {
        const url = `https://translate.google.com/translate?hl=id&sl=id&tl=en&u=${encodeURIComponent(window.location.href)}`;
        window.open(url, '_blank');
    };

    return (
        <>
            <Header light />

            <div className="news-page">
                <div className="news-article">

                    {/* Back button */}
                    <button className="news-back-btn" onClick={() => setLocation('/news')}>
                        <HiArrowLeft size={16} />
                        Kembali ke News
                    </button>

                    {/* Cover image — sits above the header */}
                    {cover && (
                        <div className="news-article__cover">
                            <img src={cover} alt={article.title} />
                        </div>
                    )}

                    {/* ── New header block (below cover) ── */}
                    <div className="na-header">

                        {/* Category badge */}
                        <span
                            className="na-badge"
                            style={{ '--badge-color': badgeColor } as React.CSSProperties}
                        >
                            {CATEGORY_ICONS[article.category]}
                            {CATEGORY_LABELS[article.category]}
                        </span>

                        {/* Title */}
                        <h1 className="na-title">{article.title}</h1>

                        {/* Excerpt as a blockquote-style lead */}
                        {article.excerpt && (
                            <div className="na-excerpt">
                                {article.excerpt}
                            </div>
                        )}

                        {/* Meta row */}
                        <div className="na-meta">
                            <span className="na-meta__item">
                                <HiCalendar size={14} />
                                {formatDate(article.date)}
                            </span>

                            {article.readTime && (
                                <span className="na-meta__item">
                                    <HiClock size={14} />
                                    {article.readTime} menit baca
                                </span>
                            )}

                            <button className="na-meta__translate" onClick={handleTranslate}>
                                <HiGlobe size={14} />
                                Terjemahkan
                                <HiChevronDown size={12} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="na-divider" />
                    </div>

                    {/* MDX content */}
                    <div className="news-prose">
                        <MDXContent />
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
