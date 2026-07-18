import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiBookmarklet, GiScrollUnfurled, GiSwordman } from 'react-icons/gi';

export default function GuidesKarakter() {
    const [, setLocation] = useLocation();

    useEffect(() => {
        document.title = 'Karakter & Hero — Tales Hero Indonesia';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <>
            <Header light />

            {/* Hero banner */}
            <section className="guides-hero">
                <div className="guides-hero__inner">
                    <div className="guides-hero__badge">
                        <GiSwordman size={16} />
                        Karakter &amp; Hero
                    </div>
                    <h1 className="guides-hero__title">Karakter &amp; Hero</h1>
                    <p className="guides-hero__sub">
                        Kenali kelas hero, kemampuan unik, dan strategi memilih karakter yang tepat untuk petualanganmu.
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
                <span className="guides-breadcrumb__link guides-breadcrumb__link--active">Karakter &amp; Hero</span>
            </div>

            {/* Content area */}
            <main className="guides-main">
                <aside className="guides-sidebar">
                    <div className="guides-sidebar__title">
                        <GiBookmarklet size={15} /> Daftar Isi
                    </div>
                    <nav className="guides-sidebar__nav">
                        <a href="#kelas"   className="guides-sidebar__link guides-sidebar__link--active">Kelas Hero</a>
                        <a href="#atribut" className="guides-sidebar__link">Atribut &amp; Stat</a>
                        <a href="#pilih"   className="guides-sidebar__link">Cara Memilih Hero</a>
                    </nav>
                </aside>

                <article className="guides-content">

                    <section id="kelas" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">01</span>
                            Kelas Hero
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tambahkan deskripsi kelas-kelas hero di sini.</p>
                        </div>
                    </section>

                    <section id="atribut" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">02</span>
                            Atribut &amp; Stat
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Jelaskan sistem atribut dan stat karakter di sini.</p>
                        </div>
                    </section>

                    <section id="pilih" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">03</span>
                            Cara Memilih Hero
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tulis panduan memilih hero sesuai gaya bermain di sini.</p>
                        </div>
                    </section>

                </article>
            </main>

            <Footer />
        </>
    );
}
