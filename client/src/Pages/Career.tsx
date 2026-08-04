import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/Style/career.scss';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    IoBriefcaseOutline, IoPersonOutline, IoMailOutline,
    IoLogoDiscord, IoCheckmarkCircle, IoChevronDown,
    IoDocumentTextOutline, IoLinkOutline, IoGameControllerOutline,
    IoLanguageOutline, IoHeadsetOutline, IoColorPaletteOutline,
    IoShieldCheckmarkOutline, IoAlertCircleOutline,
} from 'react-icons/io5';

// ── Position definitions ──────────────────────────────────────────────────────

const POSITIONS = [
    {
        id: 'Game Master',
        icon: <IoGameControllerOutline size={28} />,
        color: '#e91e63',
        colorLight: 'rgba(233,30,99,0.10)',
        colorBorder: 'rgba(233,30,99,0.25)',
        title: 'Game Master',
        short: 'Penjaga ketertiban dan kesenangan di dalam game.',
        tasks: [
            'Memantau aktivitas pemain dan menindak pelanggar aturan',
            'Memberikan bantuan teknis kepada pemain in-game',
            'Menangani laporan kecurangan (cheat, bug abuse, dll)',
            'Mengadakan event in-game dan kompetisi komunitas',
            'Berkoordinasi dengan tim Staff untuk laporan harian',
        ],
        requirements: [
            'Aktif bermain Tales Hero Indonesia minimal 2 jam/hari',
            'Memiliki akun game yang bersih (tidak pernah kena ban)',
            'Mampu bersikap profesional dan netral di hadapan pemain',
            'Siap bertugas sesuai jadwal shift yang disepakati',
        ],
    },
    {
        id: 'Translator',
        icon: <IoLanguageOutline size={28} />,
        color: '#3b82f6',
        colorLight: 'rgba(59,130,246,0.10)',
        colorBorder: 'rgba(59,130,246,0.25)',
        title: 'Translator',
        short: 'Menjembatani konten internasional ke bahasa Indonesia.',
        tasks: [
            'Menerjemahkan patch note & konten update dari Korea/Inggris ke Indonesia',
            'Memastikan terjemahan akurat, natural, dan mudah dipahami pemain',
            'Menerjemahkan konten website, news, dan panduan game',
            'Membuat glosarium istilah game agar konsisten',
            'Bekerja sama dengan tim untuk review dan revisi terjemahan',
        ],
        requirements: [
            'Fasih bahasa Indonesia dan salah satu dari: Korea atau Inggris',
            'Memahami istilah dan genre game (RPG/MMO)',
            'Teliti, teratur, dan mampu memenuhi tenggat waktu',
            'Diutamakan yang berpengalaman menerjemahkan konten digital',
        ],
    },
    {
        id: 'Customer Service',
        icon: <IoHeadsetOutline size={28} />,
        color: '#10b981',
        colorLight: 'rgba(16,185,129,0.10)',
        colorBorder: 'rgba(16,185,129,0.25)',
        title: 'Customer Service',
        short: 'Wajah ramah Tales Hero di balik setiap pesan pemain.',
        tasks: [
            'Melayani pertanyaan dan keluhan pemain via Discord & email',
            'Memberikan solusi untuk masalah akun, login, dan teknis',
            'Mendokumentasikan tiket masalah yang belum terselesaikan',
            'Meneruskan masalah kompleks ke tim yang tepat',
            'Menjaga kepuasan pemain dengan respons yang cepat dan sopan',
        ],
        requirements: [
            'Komunikatif, sabar, dan berorientasi pada solusi',
            'Mampu mengetik cepat dan menggunakan Discord dengan baik',
            'Siap melayani setidaknya 4 jam per hari',
            'Tidak mudah terpancing emosi saat menghadapi pemain yang marah',
        ],
    },
    {
        id: 'Graphics Designer',
        icon: <IoColorPaletteOutline size={28} />,
        color: '#f59e0b',
        colorLight: 'rgba(245,158,11,0.10)',
        colorBorder: 'rgba(245,158,11,0.25)',
        title: 'Graphics Designer',
        short: 'Seniman visual di balik tampilan Tales Hero Indonesia.',
        tasks: [
            'Membuat banner event, thumbnail news, dan poster promosi',
            'Mendesain aset visual untuk website dan media sosial',
            'Membuat konten grafis untuk pengumuman Discord',
            'Membantu branding dan konsistensi visual Tales Hero Indonesia',
            'Berkolaborasi dengan tim untuk kebutuhan desain mendadak',
        ],
        requirements: [
            'Mahir menggunakan Photoshop, Illustrator, atau Canva Pro',
            'Memiliki portofolio karya desain grafis (wajib dilampirkan)',
            'Memahami estetika game anime/fantasy',
            'Mampu bekerja dengan brief dan revisi yang cepat',
        ],
    },
    {
        id: 'Moderator',
        icon: <IoShieldCheckmarkOutline size={28} />,
        color: '#8b5cf6',
        colorLight: 'rgba(139,92,246,0.10)',
        colorBorder: 'rgba(139,92,246,0.25)',
        title: 'Moderator',
        short: 'Penjaga komunitas agar tetap sehat dan menyenangkan.',
        tasks: [
            'Menjaga ketertiban di server Discord dan media sosial resmi',
            'Menerapkan peraturan komunitas secara adil dan konsisten',
            'Menangani laporan anggota dan memberikan peringatan/sanksi',
            'Memfilter konten yang tidak pantas atau melanggar aturan',
            'Menciptakan suasana komunitas yang positif dan inklusif',
        ],
        requirements: [
            'Aktif di Discord Tales Hero Indonesia minimal setiap hari',
            'Memahami etika berinteraksi di komunitas online',
            'Tegas namun tetap bersikap adil dan tidak memihak',
            'Diutamakan yang sudah lama bergabung di komunitas kami',
        ],
    },
];

// ── Form state ────────────────────────────────────────────────────────────────

interface FormData {
    fullName: string;
    username: string;
    email: string;
    discord: string;
    position: string;
    motivation: string;
    experience: string;
    portfolio: string;
}

const EMPTY_FORM: FormData = {
    fullName: '', username: '', email: '', discord: '',
    position: '', motivation: '', experience: '', portfolio: '',
};

// ── Position card ─────────────────────────────────────────────────────────────

function PositionCard({ pos, onApply, index }: {
    pos: typeof POSITIONS[number];
    onApply: (id: string) => void;
    index: number;
}) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            className="career-card"
            style={{ '--card-color': pos.color, '--card-light': pos.colorLight, '--card-border': pos.colorBorder } as React.CSSProperties}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
        >
            <div className="career-card__header">
                <div className="career-card__icon-wrap" style={{ background: pos.colorLight, border: `1.5px solid ${pos.colorBorder}` }}>
                    <span style={{ color: pos.color }}>{pos.icon}</span>
                </div>
                <div className="career-card__title-group">
                    <h3 className="career-card__title" style={{ color: pos.color }}>{pos.title}</h3>
                    <p className="career-card__short">{pos.short}</p>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="career-card__detail">
                            <div className="career-card__section">
                                <p className="career-card__section-title">📋 Tanggung Jawab</p>
                                <ul className="career-card__list">
                                    {pos.tasks.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                            </div>
                            <div className="career-card__section">
                                <p className="career-card__section-title">✅ Kualifikasi</p>
                                <ul className="career-card__list">
                                    {pos.requirements.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="career-card__actions">
                <button
                    className="career-card__toggle"
                    onClick={() => setOpen(o => !o)}
                    aria-expanded={open}
                >
                    <IoChevronDown
                        size={16}
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
                    />
                    {open ? 'Sembunyikan' : 'Lihat Detail'}
                </button>
                <button
                    className="career-card__apply"
                    style={{ background: pos.color }}
                    onClick={() => onApply(pos.id)}
                >
                    Lamar Sekarang
                </button>
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Career() {
    usePageMeta({
        title: 'Karir — Tales Hero Indonesia',
        description: 'Bergabunglah dengan tim Tales Hero Indonesia. Kami membuka lowongan Game Master, Translator, Customer Service, Graphics Designer, dan Moderator.',
    });

    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [apiError, setApiError] = useState('');
    const formRef = (el: HTMLDivElement | null) => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

    const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(err => ({ ...err, [key]: undefined }));
        if (apiError) setApiError('');
    };

    const scrollToForm = (positionId?: string) => {
        if (positionId) setForm(f => ({ ...f, position: positionId }));
        document.getElementById('career-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const validate = (): boolean => {
        const e: Partial<FormData> = {};
        if (!form.fullName.trim())    e.fullName   = 'Nama lengkap wajib diisi.';
        if (!form.username.trim())    e.username   = 'Username game wajib diisi.';
        if (!form.email.trim())       e.email      = 'Email wajib diisi.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid.';
        if (!form.discord.trim())     e.discord    = 'Username Discord wajib diisi.';
        if (!form.position)           e.position   = 'Pilih posisi yang ingin dilamar.';
        if (!form.motivation.trim())  e.motivation = 'Motivasi wajib diisi.';
        else if (form.motivation.trim().length < 50) e.motivation = 'Minimal 50 karakter.';
        if (!form.experience.trim())  e.experience = 'Pengalaman wajib diisi.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setApiError('');
        try {
            const res  = await fetch('/api/career/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setApiError(data?.message ?? 'Gagal mengirim lamaran, coba lagi.'); return; }
            setSuccess(true);
            setForm(EMPTY_FORM);
        } catch {
            setApiError('Tidak dapat terhubung ke server. Coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header light />

            {/* ── Hero ── */}
            <section className="career-hero">
                <div className="career-hero__inner">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="career-hero__badge">🌟 Bergabung Bersama Kami</span>
                        <h1 className="career-hero__title">Jadilah Bagian dari<br />Tim Tales Hero Indonesia</h1>
                        <p className="career-hero__desc">
                            Kami mencari individu berdedikasi untuk membantu membangun<br />
                            komunitas game terbaik di Indonesia. Pilih posisimu di bawah ini!
                        </p>
                        <button className="game-cta-btn" onClick={() => scrollToForm()}>
                            <IoBriefcaseOutline size={16} /> Lamar Sekarang
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ── Open Positions ── */}
            <section className="career-positions">
                <div className="career-section-inner">
                    <motion.h2
                        className="career-section-title"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        Posisi yang Tersedia
                    </motion.h2>
                    <motion.p
                        className="career-section-sub"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                    >
                        Klik kartu untuk melihat detail jobdesk dan kualifikasi masing-masing posisi.
                    </motion.p>
                    <div className="career-grid">
                        {POSITIONS.map((pos, i) => (
                            <PositionCard key={pos.id} pos={pos} index={i} onApply={scrollToForm} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Application Form ── */}
            <section className="career-apply" id="career-form">
                <div className="career-section-inner career-section-inner--narrow">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="career-section-title">Formulir Lamaran</h2>
                        <p className="career-section-sub">
                            Isi formulir berikut dengan jujur dan lengkap. Kami akan menghubungimu melalui Discord atau Email dalam 3–7 hari kerja.
                        </p>

                        <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                className="career-success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <IoCheckmarkCircle size={52} color="#10b981" />
                                <h3>Lamaran Terkirim!</h3>
                                <p>Terima kasih telah melamar. Kami akan menghubungimu via Discord atau Email dalam 3–7 hari kerja.</p>
                                <button className="career-card__apply" style={{ background: '#10b981', marginTop: 8 }}
                                    onClick={() => setSuccess(false)}>
                                    Kirim Lamaran Lain
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                className="career-form"
                                onSubmit={handleSubmit}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {apiError && (
                                    <div className="career-form__error-banner">
                                        <IoAlertCircleOutline size={16} /> {apiError}
                                    </div>
                                )}

                                {/* Row 1: Nama + Username */}
                                <div className="career-form__row">
                                    <div className="career-form__field">
                                        <label htmlFor="cf-fullname"><IoPersonOutline size={13} /> Nama Lengkap <span>*</span></label>
                                        <input id="cf-fullname" type="text" placeholder="Nama lengkap kamu"
                                            value={form.fullName} onChange={set('fullName')} maxLength={100} />
                                        {errors.fullName && <p className="career-form__err">{errors.fullName}</p>}
                                    </div>
                                    <div className="career-form__field">
                                        <label htmlFor="cf-username"><IoGameControllerOutline size={13} /> Username Game <span>*</span></label>
                                        <input id="cf-username" type="text" placeholder="Username in-game kamu"
                                            value={form.username} onChange={set('username')} maxLength={50} />
                                        {errors.username && <p className="career-form__err">{errors.username}</p>}
                                    </div>
                                </div>

                                {/* Row 2: Email + Discord */}
                                <div className="career-form__row">
                                    <div className="career-form__field">
                                        <label htmlFor="cf-email"><IoMailOutline size={13} /> Email <span>*</span></label>
                                        <input id="cf-email" type="email" placeholder="email@kamu.com"
                                            value={form.email} onChange={set('email')} maxLength={200} />
                                        {errors.email && <p className="career-form__err">{errors.email}</p>}
                                    </div>
                                    <div className="career-form__field">
                                        <label htmlFor="cf-discord"><IoLogoDiscord size={13} /> Username Discord <span>*</span></label>
                                        <input id="cf-discord" type="text" placeholder="username#0000 atau @username"
                                            value={form.discord} onChange={set('discord')} maxLength={100} />
                                        {errors.discord && <p className="career-form__err">{errors.discord}</p>}
                                    </div>
                                </div>

                                {/* Posisi */}
                                <div className="career-form__field">
                                    <label htmlFor="cf-position"><IoBriefcaseOutline size={13} /> Posisi yang Dilamar <span>*</span></label>
                                    <select id="cf-position" value={form.position} onChange={set('position')}>
                                        <option value="">— Pilih posisi —</option>
                                        {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                    {errors.position && <p className="career-form__err">{errors.position}</p>}
                                </div>

                                {/* Motivasi */}
                                <div className="career-form__field">
                                    <label htmlFor="cf-motivation">
                                        <IoDocumentTextOutline size={13} /> Motivasi Bergabung <span>*</span>
                                        <em>min. 50 karakter</em>
                                    </label>
                                    <textarea id="cf-motivation" rows={4}
                                        placeholder="Ceritakan kenapa kamu ingin bergabung dengan tim Tales Hero Indonesia dan apa yang bisa kamu kontribusikan..."
                                        value={form.motivation} onChange={set('motivation')} maxLength={2000} />
                                    <span className="career-form__char">{form.motivation.length}/2000</span>
                                    {errors.motivation && <p className="career-form__err">{errors.motivation}</p>}
                                </div>

                                {/* Pengalaman */}
                                <div className="career-form__field">
                                    <label htmlFor="cf-experience">
                                        <IoDocumentTextOutline size={13} /> Pengalaman Relevan <span>*</span>
                                    </label>
                                    <textarea id="cf-experience" rows={4}
                                        placeholder="Ceritakan pengalaman kamu yang relevan dengan posisi yang dilamar. Tidak ada pengalaman? Tulis keahlian dan semangat belajarmu!"
                                        value={form.experience} onChange={set('experience')} maxLength={2000} />
                                    <span className="career-form__char">{form.experience.length}/2000</span>
                                    {errors.experience && <p className="career-form__err">{errors.experience}</p>}
                                </div>

                                {/* Portfolio (optional) */}
                                <div className="career-form__field">
                                    <label htmlFor="cf-portfolio">
                                        <IoLinkOutline size={13} /> Link Portofolio / Sosmed
                                        <em>opsional — wajib untuk Graphics Designer</em>
                                    </label>
                                    <input id="cf-portfolio" type="text"
                                        placeholder="https://behance.net/kamu atau link lainnya"
                                        value={form.portfolio} onChange={set('portfolio')} maxLength={500} />
                                </div>

                                <button className="career-form__submit" type="submit" disabled={loading}>
                                    {loading
                                        ? <><span className="career-form__spinner" /> Mengirim...</>
                                        : <><IoBriefcaseOutline size={16} /> Kirim Lamaran</>
                                    }
                                </button>
                            </motion.form>
                        )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </>
    );
}
