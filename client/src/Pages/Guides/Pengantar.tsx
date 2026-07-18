import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiScrollUnfurled } from 'react-icons/gi';

export default function GuidesPengantar() {
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

            {/* Character showcase section */}
            <section className="pengantar-showcase">
                <div className="pengantar-showcase__char pengantar-showcase__char--left">
                    <img src="/Image/Pengantar/character1.png" alt="Tales Hero Character" />
                </div>

                <div className="pengantar-showcase__center">
                    <p className="pengantar-showcase__sub">
                        Petualangan di dunia penuh pahlawan legendaris
                    </p>
                    <h2 className="pengantar-showcase__heading">
                        Jadilah hero<br />terkuat!
                    </h2>
                    <p className="pengantar-showcase__accent">Tales Hero Indonesia</p>
                    <p className="pengantar-showcase__desc">
                        Tales Hero adalah <span className="pengantar-showcase__highlight">game action-adventure online</span> yang menghadirkan
                        dunia fantasi epik dengan jutaan pemain di seluruh Indonesia.
                    </p>
                    <p className="pengantar-showcase__desc">
                        Jadilah protagonis dalam kisah heroikmu — jelajahi dungeon, taklukkan boss legendaris,
                        dan tulis namamu di papan peringkat bersama guild terkuat!
                    </p>
                </div>

                <div className="pengantar-showcase__char pengantar-showcase__char--right">
                    <img src="/Image/Pengantar/character2.png" alt="Tales Hero Character" />
                </div>
            </section>

            <Footer />
        </>
    );
}
