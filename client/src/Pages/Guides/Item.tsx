import { usePageMeta } from '@/Hooks/use-page-meta';
import { useLocation } from 'wouter';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiBookmarklet, GiScrollUnfurled, GiTreasureMap } from 'react-icons/gi';

export default function GuidesItem() {
    const [, setLocation] = useLocation();

    usePageMeta({
        title: 'Item & Equipment — Tales Hero Indonesia',
        description: 'Temukan semua item dan equipment yang bisa kamu gunakan untuk memperkuat hero di Tales Hero Indonesia.',
    });

    return (
        <>
            <Header light />

            {/* Hero banner */}
            <section className="guides-hero">
                <div className="guides-hero__inner">
                    <div className="guides-hero__badge">
                        <GiTreasureMap size={16} />
                        Item &amp; Equipment
                    </div>
                    <h1 className="guides-hero__title">Item &amp; Equipment</h1>
                    <p className="guides-hero__sub">
                        Temukan senjata terbaik, armor terkuat, dan cara mendapatkan item langka untuk heromu.
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
                <span className="guides-breadcrumb__link guides-breadcrumb__link--active">Item &amp; Equipment</span>
            </div>

            {/* Content area */}
            <main className="guides-main">
                <aside className="guides-sidebar">
                    <div className="guides-sidebar__title">
                        <GiBookmarklet size={15} /> Daftar Isi
                    </div>
                    <nav className="guides-sidebar__nav">
                        <a href="#jenis"   className="guides-sidebar__link guides-sidebar__link--active">Jenis Item</a>
                        <a href="#armor"   className="guides-sidebar__link">Armor &amp; Senjata</a>
                        <a href="#langka"  className="guides-sidebar__link">Item Langka</a>
                    </nav>
                </aside>

                <article className="guides-content">

                    <section id="jenis" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">01</span>
                            Jenis Item
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tambahkan penjelasan kategori item di sini.</p>
                        </div>
                    </section>

                    <section id="armor" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">02</span>
                            Armor &amp; Senjata
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Jelaskan jenis senjata dan armor beserta stat-nya di sini.</p>
                        </div>
                    </section>

                    <section id="langka" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">03</span>
                            Item Langka
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tulis cara mendapatkan item langka dan legendary di sini.</p>
                        </div>
                    </section>

                </article>
            </main>

            <Footer />
        </>
    );
}
