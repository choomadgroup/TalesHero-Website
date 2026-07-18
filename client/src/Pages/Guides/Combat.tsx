import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiBookmarklet, GiScrollUnfurled, GiSwordClash } from 'react-icons/gi';

export default function GuidesCombat() {
    const [, setLocation] = useLocation();

    useEffect(() => {
        document.title = 'Sistem Pertarungan — Tales Hero Indonesia';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <>
            <Header light />

            {/* Hero banner */}
            <section className="guides-hero">
                <div className="guides-hero__inner">
                    <div className="guides-hero__badge">
                        <GiSwordClash size={16} />
                        Sistem Pertarungan
                    </div>
                    <h1 className="guides-hero__title">Sistem Pertarungan</h1>
                    <p className="guides-hero__sub">
                        Kuasai mekanisme battle, skill combo, dan strategi bertarung untuk menjadi hero terkuat.
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
                <span className="guides-breadcrumb__link guides-breadcrumb__link--active">Sistem Pertarungan</span>
            </div>

            {/* Content area */}
            <main className="guides-main">
                <aside className="guides-sidebar">
                    <div className="guides-sidebar__title">
                        <GiBookmarklet size={15} /> Daftar Isi
                    </div>
                    <nav className="guides-sidebar__nav">
                        <a href="#mekanik" className="guides-sidebar__link guides-sidebar__link--active">Mekanik Battle</a>
                        <a href="#skill"   className="guides-sidebar__link">Skill &amp; Combo</a>
                        <a href="#strategi" className="guides-sidebar__link">Strategi Bertarung</a>
                    </nav>
                </aside>

                <article className="guides-content">

                    <section id="mekanik" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">01</span>
                            Mekanik Battle
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tambahkan penjelasan mekanik dasar pertarungan di sini.</p>
                        </div>
                    </section>

                    <section id="skill" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">02</span>
                            Skill &amp; Combo
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Jelaskan sistem skill dan cara mengombinasikannya di sini.</p>
                        </div>
                    </section>

                    <section id="strategi" className="guides-section">
                        <h2 className="guides-section__title">
                            <span className="guides-section__num">03</span>
                            Strategi Bertarung
                        </h2>
                        <div className="guides-placeholder">
                            <GiScrollUnfurled size={32} />
                            <p>Tulis tips dan strategi menghadapi berbagai musuh di sini.</p>
                        </div>
                    </section>

                </article>
            </main>

            <Footer />
        </>
    );
}
