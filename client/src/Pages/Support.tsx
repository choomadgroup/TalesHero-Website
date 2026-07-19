import { useState } from 'react';
import { usePageMeta } from '@/Hooks/use-page-meta';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { IoChevronDown, IoLogoDiscord, IoMail, IoLogoWhatsapp, IoSearch } from 'react-icons/io5';
import { GiScrollUnfurled } from 'react-icons/gi';
import Header from '../Components/Header';
import Footer from '../Components/Footer';

const FAQS = [
    {
        q: 'Bagaimana cara membuat akun Tales Hero Indonesia?',
        a: 'Fitur pendaftaran akun sedang dalam tahap pengembangan. Pantau terus website dan media sosial kami untuk informasi pembukaan pendaftaran pertama!',
    },
    {
        q: 'Game Tales Hero Indonesia bisa dimainkan di perangkat apa saja?',
        a: 'Tales Hero Indonesia tersedia untuk PC Windows dan Android. Versi iOS sedang dalam persiapan dan akan segera dirilis. Pastikan perangkat kamu memenuhi spesifikasi minimum yang tertera di halaman Download.',
    },
    {
        q: 'Apakah Tales Hero Indonesia gratis?',
        a: 'Ya! Tales Hero Indonesia bisa dimainkan secara gratis (Free-to-Play). Tersedia item kosmetik opsional yang bisa dibeli, namun tidak mempengaruhi gameplay.',
    },
    {
        q: 'Game tidak bisa dibuka atau error setelah install. Apa solusinya?',
        a: 'Coba langkah berikut: (1) Pastikan spesifikasi PC kamu memenuhi syarat minimum. (2) Update driver VGA ke versi terbaru. (3) Jalankan game sebagai Administrator. (4) Matikan sementara antivirus. Jika masih error, hubungi tim support kami.',
    },
    {
        q: 'Bagaimana cara melaporkan pemain yang curang (cheater)?',
        a: 'Kamu bisa melaporkan pemain curang melalui menu Report di dalam game, atau kirimkan laporan detail ke email support kami disertai bukti screenshot/video.',
    },
    {
        q: 'Kapan event server pertama akan diadakan?',
        a: 'Informasi jadwal event akan diumumkan melalui website resmi dan Discord server kami. Join Discord sekarang agar tidak ketinggalan info terbaru!',
    },
    {
        q: 'Apakah progress game akan di-reset saat Open Beta?',
        a: 'Progress karakter dan akun akan di-reset saat memasuki fase Open Beta untuk memastikan fairness semua pemain. Akan ada kompensasi spesial untuk pemain Closed Beta.',
    },
];

const CONTACTS = [
    {
        id: 'discord',
        icon: <IoLogoDiscord size={28} />,
        label: 'Discord',
        desc: 'Komunitas aktif, event, dan update terbaru',
        value: 'Join Server',
        color: '#5865F2',
        href: 'https://discord.gg/rTyNWEQhxB',
    },
    {
        id: 'email',
        icon: <IoMail size={28} />,
        label: 'Email Support',
        desc: 'Untuk laporan bug dan pertanyaan teknis',
        value: 'support@taleshero.web.id',
        color: '#fab005',
        href: 'mailto:support@taleshero.web.id',
    },
    {
        id: 'wa',
        icon: <IoLogoWhatsapp size={28} />,
        label: 'WhatsApp',
        desc: 'Respon cepat untuk pertanyaan umum',
        value: 'Chat Sekarang',
        color: '#25d366',
        href: '#',
    },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            className={`sp-faq-item ${open ? 'sp-faq-item--open' : ''}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: index * 0.07, duration: 0.4 }}
        >
            <button className="sp-faq-item__q" onClick={() => setOpen(o => !o)}>
                <GiScrollUnfurled size={16} className="sp-faq-item__icon" />
                <span>{q}</span>
                <IoChevronDown className={`sp-faq-item__chevron ${open ? 'rotated' : ''}`} size={18} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p className="sp-faq-item__a">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function Support() {
    const [search, setSearch] = useState('');
    usePageMeta({
        title: 'Support — Tales Hero Indonesia',
        description: 'Butuh bantuan? Hubungi tim support Tales Hero Indonesia atau temukan jawaban di FAQ kami.',
    });
    const [, setLocation] = useLocation();

    const filtered = search.trim()
        ? FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
        : FAQS;

    return (
        <>
            <Header light />

            {/* Hero */}
            <section className="sp-hero">
                <div className="sp-hero__inner">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="sp-hero__badge">🛡️ Pusat Bantuan</span>
                        <h1 className="sp-hero__title">Ada yang Bisa<br />Kami Bantu?</h1>
                        <p className="sp-hero__desc">
                            Temukan jawaban dari pertanyaan yang sering ditanyakan,<br />
                            atau hubungi tim kami langsung.
                        </p>
                        {/* Search */}
                        <div className="sp-hero__search-wrap">
                            <IoSearch size={18} className="sp-hero__search-icon" />
                            <input
                                className="sp-hero__search"
                                placeholder="Cari pertanyaan…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Contact cards */}
            <section className="sp-contacts">
                <div className="sp-section-inner">
                    <div className="sp-contacts-grid">
                        {CONTACTS.map((c, i) => (
                            <motion.a
                                key={c.id}
                                href={c.href}
                                className="sp-contact-card"
                                style={{ '--card-color': c.color } as React.CSSProperties}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                            >
                                <div className="sp-contact-card__icon" style={{ color: c.color }}>{c.icon}</div>
                                <h3 className="sp-contact-card__label">{c.label}</h3>
                                <p className="sp-contact-card__desc">{c.desc}</p>
                                <span className="sp-contact-card__value" style={{ color: c.color }}>{c.value}</span>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="sp-faq">
                <div className="sp-section-inner">
                    <h2 className="sp-section-title">Pertanyaan yang Sering Ditanyakan</h2>
                    {filtered.length > 0
                        ? filtered.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} index={i} />)
                        : <p className="sp-faq-empty">Tidak ada hasil untuk "<strong>{search}</strong>"</p>
                    }
                </div>
            </section>

            {/* CTA */}
            <section className="sp-cta">
                <div className="sp-section-inner sp-cta__inner">
                    <div className="sp-cta__chars">
                        {[
                            { src: '/Image/Karakter/Art/Chloe.png', alt: 'Chloe', y: 0   },
                            { src: '/Image/Karakter/Art/Abel.png',  alt: 'Abel',  y: -15 },
                            { src: '/Image/Karakter/Art/Sid.png',   alt: 'Sid',   y: 0   },
                            { src: '/Image/Karakter/Art/LaLa.png',  alt: 'LaLa',  y: -8  },
                        ].map((c, i) => (
                            <motion.img
                                key={c.alt}
                                src={c.src}
                                alt={c.alt}
                                className="sp-cta__char-img"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: c.y }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                style={{ filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.12))' }}
                            />
                        ))}
                    </div>
                    <div>
                        <h2 className="sp-cta__title">Masih Butuh Bantuan?</h2>
                        <p className="sp-cta__desc">Tim kami siap membantu kamu 24 jam melalui Discord dan Email.</p>
                        <div className="sp-cta__btns">
                            <a href="https://discord.gg/rTyNWEQhxB" className="game-cta-btn" target="_blank" rel="noopener noreferrer">
                                <IoLogoDiscord size={16} /> Join Discord
                            </a>
                            <button className="game-login-btn" onClick={() => setLocation('/')}>
                                Kembali ke Beranda
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
