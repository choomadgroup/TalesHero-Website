import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { GiCrossedSwords, GiScrollUnfurled } from 'react-icons/gi';

const fromLeft  = { hidden: { opacity: 0, x: -60 }, show: { opacity: 1, x: 0 } };
const fromRight = { hidden: { opacity: 0, x:  60 }, show: { opacity: 1, x: 0 } };
const fromBelow = { hidden: { opacity: 0, y:  40 }, show: { opacity: 1, y: 0 } };

const transition = { duration: 0.6, ease: 'easeOut' };
const viewport   = { once: true, amount: 0.25 };

export default function GuidesPengantar() {
    const [, setLocation] = useLocation();

    useEffect(() => {
        document.title = 'Pengantar — Tales Hero Indonesia';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <>
            <Header light />

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
                <motion.div
                    className="pengantar-showcase__char pengantar-showcase__char--left"
                    variants={fromLeft} initial="hidden" whileInView="show"
                    transition={transition} viewport={viewport}
                >
                    <img src="/Image/Pengantar/character1.png" alt="Tales Hero Character" />
                </motion.div>

                <motion.div
                    className="pengantar-showcase__center"
                    variants={fromBelow} initial="hidden" whileInView="show"
                    transition={{ ...transition, delay: 0.1 }} viewport={viewport}
                >
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
                </motion.div>

                <motion.div
                    className="pengantar-showcase__char pengantar-showcase__char--right"
                    variants={fromRight} initial="hidden" whileInView="show"
                    transition={transition} viewport={viewport}
                >
                    <img src="/Image/Pengantar/character2.png" alt="Tales Hero Character" />
                </motion.div>
            </section>

            {/* Story sections */}
            <div className="pengantar-story">

                {/* Section 1 — text left, image right */}
                <section className="pengantar-story__row">
                    <motion.div
                        className="pengantar-story__text"
                        variants={fromLeft} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <h2 className="pengantar-story__heading pengantar-story__heading--blue">
                            Dunia Fantasi<br />yang Indah
                        </h2>
                        <p className="pengantar-story__desc">
                            Di dunia yang dipenuhi kekuatan magis dan makhluk legendaris, Kerajaan Tales berdiri megah
                            di bawah langit yang selalu cerah, diperintah oleh raja yang adil dan bijaksana.
                        </p>
                        <p className="pengantar-story__desc">
                            Dengan bantuan para hero pemberani yang menjaga kedamaian, kerajaan ini menjadi tempat
                            di mana semua petualangan epik bermula — dan di sinilah kisahmu dimulai.
                        </p>
                    </motion.div>
                    <motion.div
                        className="pengantar-story__img-wrap"
                        variants={fromRight} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <div className="pengantar-story__circle pengantar-story__circle--lg">
                            <img src="/Image/Pengantar/obj1_1.png" alt="Dunia Fantasi" />
                        </div>
                        <div className="pengantar-story__circle pengantar-story__circle--sm">
                            <img src="/Image/Pengantar/obj1_2.png" alt="Detail" />
                        </div>
                    </motion.div>
                </section>

                {/* Section 2 — image left, text right */}
                <section className="pengantar-story__row">
                    <motion.div
                        className="pengantar-story__img-wrap"
                        variants={fromLeft} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <div className="pengantar-story__circle pengantar-story__circle--lg">
                            <img src="/Image/Pengantar/obj2_1.png" alt="Ancaman Kegelapan" />
                        </div>
                        <div className="pengantar-story__circle pengantar-story__circle--sm">
                            <img src="/Image/Pengantar/obj2_2.png" alt="Detail" />
                        </div>
                    </motion.div>
                    <motion.div
                        className="pengantar-story__text"
                        variants={fromRight} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <h2 className="pengantar-story__heading pengantar-story__heading--orange">
                            Ancaman<br />Kegelapan
                        </h2>
                        <p className="pengantar-story__desc">
                            Dari balik bayangan datang kekuatan jahat yang mengancam keseimbangan dunia — monster-monster
                            ganas menyerang desa, dungeon bermunculan di mana-mana, dan para warga kehilangan harapan.
                        </p>
                        <p className="pengantar-story__desc">
                            Menyadari bahwa kerajaan mungkin musnah selamanya, sang raja membuat keputusan besar:
                            memanggil para hero sejati dari seluruh penjuru untuk menghadapi ancaman ini bersama.
                        </p>
                    </motion.div>
                </section>

                {/* Section 3 — text left, image right */}
                <section className="pengantar-story__row">
                    <motion.div
                        className="pengantar-story__text"
                        variants={fromLeft} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <h2 className="pengantar-story__heading pengantar-story__heading--pink">
                            Turnamen Hero<br />Dimulai
                        </h2>
                        <p className="pengantar-story__desc">
                            Kerajaan Tales menyelenggarakan turnamen besar di mana para hero bertarung membuktikan
                            kehebatan mereka — mengalahkan boss, menyelesaikan dungeon, dan memenangkan kejuaraan antar guild.
                        </p>
                        <p className="pengantar-story__desc">
                            Hero yang berhasil memenangkan turnamen akan menerima <em>Batu Impian</em> — artefak
                            legendaris yang mampu mengabulkan satu keinginan dan mengangkat nama guild ke puncak papan peringkat.
                        </p>
                    </motion.div>
                    <motion.div
                        className="pengantar-story__img-wrap"
                        variants={fromRight} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <div className="pengantar-story__circle pengantar-story__circle--lg">
                            <img src="/Image/Pengantar/obj3_1.png" alt="Turnamen Hero" />
                        </div>
                        <div className="pengantar-story__circle pengantar-story__circle--sm">
                            <img src="/Image/Pengantar/obj3_2.png" alt="Detail" />
                        </div>
                    </motion.div>
                </section>

                {/* Section 4 — image left, text right */}
                <section className="pengantar-story__row">
                    <motion.div
                        className="pengantar-story__img-wrap"
                        variants={fromLeft} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <div className="pengantar-story__circle pengantar-story__circle--lg">
                            <img src="/Image/Pengantar/obj4_1.png" alt="Hero dan Kisah Anda" />
                        </div>
                        <div className="pengantar-story__circle pengantar-story__circle--sm">
                            <img src="/Image/Pengantar/obj4_2.png" alt="Detail" />
                        </div>
                    </motion.div>
                    <motion.div
                        className="pengantar-story__text"
                        variants={fromRight} initial="hidden" whileInView="show"
                        transition={transition} viewport={viewport}
                    >
                        <h2 className="pengantar-story__heading pengantar-story__heading--green">
                            Hero dan<br />Kisah Anda
                        </h2>
                        <p className="pengantar-story__desc">
                            Para hero dari seluruh Indonesia telah datang ke Kerajaan Tales, masing-masing membawa
                            cerita dan tujuan mereka sendiri — bergabung dalam guild, membangun persahabatan, dan menempa takdir.
                        </p>
                        <p className="pengantar-story__desc">
                            Di tanah fantasi yang terus berubah, kisah hero dan perjalananmu akan terus berlanjut —
                            dan legenda yang kamu tulis hari ini akan dikenang selamanya.
                        </p>
                    </motion.div>
                </section>

            </div>

            <Footer />
        </>
    );
}
