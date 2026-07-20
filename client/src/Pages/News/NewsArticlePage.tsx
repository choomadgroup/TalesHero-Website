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
import { HiArrowLeft, HiNewspaper } from 'react-icons/hi';
import { MdUpdate, MdInfoOutline, MdBuildCircle } from 'react-icons/md';

const CATEGORY_ICONS: Record<NewsCategory, React.ReactNode> = {
    update:      <MdUpdate size={14} />,
    info:        <MdInfoOutline size={14} />,
    maintenance: <MdBuildCircle size={14} />,
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

    return (
        <>
            <Header light />

            <div className="news-page">
                <div className="news-article">

                    {/* Breadcrumb */}
                    <div className="news-article__breadcrumb">
                        <button onClick={() => setLocation('/news')}>News</button>
                        <span>/</span>
                        <span className="news-article__breadcrumb-cat" style={{ color: badgeColor }}>
                            {CATEGORY_LABELS[article.category]}
                        </span>
                    </div>

                    {/* Back button */}
                    <button className="news-back-btn" onClick={() => setLocation('/news')}>
                        <HiArrowLeft size={16} />
                        Kembali ke News
                    </button>

                    {/* Article header */}
                    <div className="news-article__header">
                        <span
                            className="news-card__badge"
                            style={{ '--badge-color': badgeColor } as React.CSSProperties}
                        >
                            {CATEGORY_ICONS[article.category]}
                            {CATEGORY_LABELS[article.category]}
                        </span>
                        <h1 className="news-article__title">{article.title}</h1>
                        <time className="news-article__date">{formatDate(article.date)}</time>
                    </div>

                    {/* Cover image */}
                    {cover && (
                        <div className="news-article__cover">
                            <img src={cover} alt={article.title} />
                        </div>
                    )}

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
