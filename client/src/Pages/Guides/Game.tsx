import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiBookmarklet, GiScrollUnfurled } from 'react-icons/gi';

export default function GuidesGame() {
    const [, setLocation] = useLocation();

    useEffect(() => {
        document.title = 'Pengantar — Tales Hero Indonesia';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <>
            <Header />

            {/* Hero banner */}
            <section className="guides-hero">
                <div className="guides-hero__inner">
                    <div className="guides-hero__badge">
                        <GiScrollUnfurled size={16} />
                        Pengenalan Game
                    </div>
                    <h1 className="guides-hero__title">Pengantar Tales Hero</h1>
                    <p className="guides-hero__sub">
                        Pelajari dasar-dasar dunia Tales Hero Indonesia dan mulai petualanganmu sebagai hero legendaris.
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
                <span className="guides-breadcrumb__link guides-breadcrumb__link--active">Pengantar</span>
            </div>

            {/* Content area */}
            <main className="guides-main">
                <aside className="guides-sidebar">
                    <div className="guides-sidebar__title">
                        <GiBookmarklet size={15} /> Daftar Isi
                    </div>
                    <nav className="guides-sidebar__nav">
                        <a href="#tentang" className="guides-sidebar__link guides-sidebar__link--active">Tentang Game</a>
                        <a href="#genre"   className="guides-sidebar__link">Genre &amp; Gameplay</a>
                        <a href="#mulai"   className="guides-sidebar__link">Cara Memulai</a>
                    </nav>
                </aside>

                <article className="guides-content">

                    {/* Tentang */}
                    <section id="tentang" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">01</span>
                            Tentang Game
                        </h2>
                        {/* ✏️ Isi konten di sini */}
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tambahkan deskripsi tentang Tales Hero Indonesia di sini.</p>
                        </div>
                    </section>

                    {/* Genre */}
                    <section id="genre" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">02</span>
                            Genre &amp; Gameplay
                        </h2>
                        {/* ✏️ Isi konten di sini */}
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Jelaskan genre dan mekanisme gameplay di sini.</p>
                        </div>
                    </section>

                    {/* Cara Mulai */}
                    <section id="mulai" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">03</span>
                            Cara Memulai
                        </h2>
                        {/* ✏️ Isi konten di sini */}
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tulis panduan langkah awal bermain di sini.</p>
                        </div>
                    </section>

                </article>
            </main>

            <Footer />
        </>
    );
}
