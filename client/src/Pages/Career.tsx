import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/Style/career.scss';
import { usePageMeta } from '@/Hooks/use-page-meta';
import { useAuth } from '@/Hooks/use-auth';
import { useLocation } from 'wouter';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    IoBriefcaseOutline, IoMailOutline,
    IoLogoDiscord, IoCheckmarkCircle, IoChevronDown,
    IoDocumentTextOutline, IoLinkOutline, IoGameControllerOutline,
    IoLanguageOutline, IoHeadsetOutline, IoColorPaletteOutline,
    IoShieldCheckmarkOutline, IoAlertCircleOutline, IoCodeSlashOutline,
    IoPersonCircleOutline, IoLockClosedOutline, IoTimeOutline, IoCalendarOutline,
    IoPersonOutline, IoStarOutline, IoHelpCircleOutline,
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
        id: 'Developer',
        icon: <IoCodeSlashOutline size={28} />,
        color: '#06b6d4',
        colorLight: 'rgba(6,182,212,0.10)',
        colorBorder: 'rgba(6,182,212,0.25)',
        title: 'Developer',
        short: 'Membangun dan mengembangkan fitur-fitur Tales Hero Indonesia.',
        tasks: [
            'Mengembangkan dan memelihara website Tales Hero Indonesia',
            'Membuat fitur baru berdasarkan kebutuhan tim dan komunitas',
            'Memperbaiki bug dan meningkatkan performa aplikasi',
            'Berkolaborasi dengan tim desain untuk implementasi UI/UX',
            'Mengelola database dan integrasi dengan sistem game',
        ],
        requirements: [
            'Menguasai salah satu atau lebih: JavaScript/TypeScript, React, Node.js',
            'Memahami konsep REST API, database (MySQL/MongoDB)',
            'Familiar dengan Git dan workflow pengembangan tim',
            'Mampu bekerja mandiri dan berkomunikasi aktif dengan tim',
            'Diutamakan yang memiliki portofolio project web yang bisa ditunjukkan',
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(isoDate: string): number {
    const ms = new Date(isoDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// ── Position card ─────────────────────────────────────────────────────────────

function PositionCard({ pos, available, onApply, index }: {
    pos: typeof POSITIONS[number];
    available: boolean;
    onApply: (id: string) => void;
    index: number;
}) {
    const [open, setOpen] = useState(false);
    return (
        <motion.div
            className={`career-card${!available ? ' career-card--closed' : ''}`}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h3 className="career-card__title" style={{ color: pos.color }}>{pos.title}</h3>
                        {!available
                            ? <span className="career-card__badge career-card__badge--closed">Ditutup</span>
                            : <span className="career-card__badge career-card__badge--open">Buka</span>
                        }
                    </div>
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
                <button className="career-card__toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
                    <IoChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
                    {open ? 'Sembunyikan' : 'Lihat Detail'}
                </button>
                {available ? (
                    <button className="career-card__apply" style={{ background: pos.color }} onClick={() => onApply(pos.id)}>
                        Lamar Sekarang
                    </button>
                ) : (
                    <span className="career-card__apply career-card__apply--closed">Tidak Tersedia</span>
                )}
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface MyStatus {
    canApply: boolean;
    reason?: 'pending' | 'reviewed' | 'accepted' | 'cooldown';
    cooldownUntil?: string;
    application?: { position: string; status: string; createdAt: string };
}

interface FormData {
    fullName: string;
    birthDate: string;
    discord: string;
    position: string;
    whyJoin: string;
    whatSkills: string;
    whyChooseYou: string;
    isAvailable: boolean | null;
    experience: string;
    portfolio: string;
}

const EMPTY_FORM: FormData = {
    fullName: '', birthDate: '', discord: '', position: '',
    whyJoin: '', whatSkills: '', whyChooseYou: '',
    isAvailable: null, experience: '', portfolio: '',
};

export default function Career() {
    usePageMeta({
        title: 'Karir — Tales Hero Indonesia',
        description: 'Bergabunglah dengan tim Tales Hero Indonesia. Kami membuka lowongan Game Master, Translator, Customer Service, Graphics Designer, Developer, dan Moderator.',
    });

    const { user, loading: authLoading } = useAuth();
    const [, setLocation] = useLocation();

    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [availLoading, setAvailLoading]  = useState(true);

    const [myStatus, setMyStatus]         = useState<MyStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const [form, setForm]         = useState<FormData>(EMPTY_FORM);
    const [errors, setErrors]     = useState<Partial<Record<keyof FormData, string>>>({});
    const [loading, setLoading]   = useState(false);
    const [success, setSuccess]   = useState(false);
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        fetch('/api/career/positions')
            .then(r => r.json())
            .then(d => { if (d.ok) setAvailability(d.positions); })
            .catch(() => {})
            .finally(() => setAvailLoading(false));
    }, []);

    useEffect(() => {
        if (!user) { setMyStatus(null); return; }
        setStatusLoading(true);
        fetch('/api/career/my-status', { credentials: 'include' })
            .then(r => r.json())
            .then(d => { if (d.ok) setMyStatus(d); })
            .catch(() => {})
            .finally(() => setStatusLoading(false));
    }, [user]);

    const setField = (key: keyof FormData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            setForm(f => ({ ...f, [key]: e.target.value }));
            if (errors[key]) setErrors(err => ({ ...err, [key]: undefined }));
            if (apiError) setApiError('');
        };

    const setAvail = (val: boolean) => {
        setForm(f => ({ ...f, isAvailable: val }));
        if (errors.isAvailable) setErrors(err => ({ ...err, isAvailable: undefined }));
        if (apiError) setApiError('');
    };

    const scrollToForm = (positionId?: string) => {
        if (positionId) setForm(f => ({ ...f, position: positionId }));
        document.getElementById('career-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const validate = (): boolean => {
        const e: Partial<Record<keyof FormData, string>> = {};
        if (!form.fullName.trim())        e.fullName     = 'Nama lengkap wajib diisi.';
        if (!form.birthDate)              e.birthDate    = 'Tanggal lahir wajib diisi.';
        if (!form.discord.trim())         e.discord      = 'Username Discord wajib diisi.';
        if (!form.position)               e.position     = 'Pilih posisi yang ingin dilamar.';
        if (!form.whyJoin.trim())         e.whyJoin      = 'Kolom ini wajib diisi.';
        else if (form.whyJoin.trim().length < 30) e.whyJoin = 'Minimal 30 karakter.';
        if (!form.whatSkills.trim())      e.whatSkills   = 'Kolom ini wajib diisi.';
        else if (form.whatSkills.trim().length < 30) e.whatSkills = 'Minimal 30 karakter.';
        if (!form.whyChooseYou.trim())    e.whyChooseYou = 'Kolom ini wajib diisi.';
        else if (form.whyChooseYou.trim().length < 30) e.whyChooseYou = 'Minimal 30 karakter.';
        if (form.isAvailable === null)    e.isAvailable  = 'Pilih salah satu jawaban.';
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
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setApiError(data?.message ?? 'Gagal mengirim lamaran, coba lagi.'); return; }
            setSuccess(true);
            setForm(EMPTY_FORM);
            fetch('/api/career/my-status', { credentials: 'include' })
                .then(r => r.json()).then(d => { if (d.ok) setMyStatus(d); }).catch(() => {});
        } catch {
            setApiError('Tidak dapat terhubung ke server. Coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    // ── Open positions for dropdown ───────────────────────────────────────────
    const openPositions = POSITIONS.filter(p => availability[p.id] !== false);

    // ── Form area renderer ────────────────────────────────────────────────────
    const renderFormArea = () => {
        if (authLoading || statusLoading) {
            return (
                <div className="career-gate">
                    <div className="career-gate__spinner" />
                    <p>Memeriksa sesi...</p>
                </div>
            );
        }

        if (!user) {
            return (
                <motion.div className="career-gate" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <IoLockClosedOutline size={48} color="#e91e63" />
                    <h3>Login untuk Melamar</h3>
                    <p>Kamu harus login dengan akun Tales Hero Indonesia sebelum bisa mengisi formulir lamaran.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="career-card__apply" style={{ background: '#e91e63' }} onClick={() => setLocation('/login')}>
                            <IoPersonCircleOutline size={15} /> Masuk Sekarang
                        </button>
                        <button className="career-card__toggle" onClick={() => setLocation('/daftar')}>
                            Daftar Akun
                        </button>
                    </div>
                </motion.div>
            );
        }

        if (success) {
            return (
                <motion.div className="career-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <IoCheckmarkCircle size={52} color="#10b981" />
                    <h3>Lamaran Terkirim!</h3>
                    <p>Terima kasih telah melamar, <strong>{user.nickname || user.username}</strong>! Kami akan menghubungimu via Discord atau Email dalam 3–7 hari kerja.</p>
                </motion.div>
            );
        }

        if (myStatus && !myStatus.canApply) {
            if (myStatus.reason === 'accepted') {
                return (
                    <motion.div className="career-gate career-gate--accepted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <IoCheckmarkCircle size={48} color="#10b981" />
                        <h3>Selamat, Kamu Sudah Diterima! 🎉</h3>
                        <p>Lamaranmu untuk posisi <strong>{myStatus.application?.position}</strong> telah diterima. Tim kami akan segera menghubungimu.</p>
                    </motion.div>
                );
            }
            if (myStatus.reason === 'pending' || myStatus.reason === 'reviewed') {
                return (
                    <motion.div className="career-gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <IoTimeOutline size={48} color="#f59e0b" />
                        <h3>Lamaran Sedang Diproses</h3>
                        <p>Lamaranmu untuk posisi <strong>{myStatus.application?.position}</strong> sedang dalam proses review. Harap bersabar, kami akan menghubungimu segera.</p>
                        <span className="career-gate__status career-gate__status--pending">
                            Status: {myStatus.reason === 'reviewed' ? 'Sedang Ditinjau' : 'Menunggu Review'}
                        </span>
                    </motion.div>
                );
            }
            if (myStatus.reason === 'cooldown' && myStatus.cooldownUntil) {
                const days = daysUntil(myStatus.cooldownUntil);
                return (
                    <motion.div className="career-gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <IoTimeOutline size={48} color="#6366f1" />
                        <h3>Masa Tunggu Aktif</h3>
                        <p>Kamu baru bisa melamar kembali dalam <strong>{days} hari</strong> lagi.</p>
                        <span className="career-gate__status">
                            Dapat melamar kembali: {new Date(myStatus.cooldownUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </motion.div>
                );
            }
        }

        return (
            <motion.form className="career-form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {apiError && (
                    <div className="career-form__error-banner">
                        <IoAlertCircleOutline size={16} /> {apiError}
                    </div>
                )}

                {/* ── Nama Lengkap + Tanggal Lahir ── */}
                <div className="career-form__row">
                    <div className="career-form__field">
                        <label htmlFor="cf-fullname"><IoPersonOutline size={13} /> Nama Lengkap <span>*</span></label>
                        <input id="cf-fullname" type="text" placeholder="Nama lengkap sesuai KTP"
                            value={form.fullName} onChange={setField('fullName')} maxLength={150} />
                        {errors.fullName && <p className="career-form__err">{errors.fullName}</p>}
                    </div>
                    <div className="career-form__field">
                        <label htmlFor="cf-birth"><IoCalendarOutline size={13} /> Tanggal Lahir <span>*</span></label>
                        <input id="cf-birth" type="date"
                            value={form.birthDate} onChange={setField('birthDate')}
                            max={new Date().toISOString().split('T')[0]} />
                        {errors.birthDate && <p className="career-form__err">{errors.birthDate}</p>}
                    </div>
                </div>

                {/* ── Nickname + Email (auto, readonly) ── */}
                <div className="career-form__row">
                    <div className="career-form__field">
                        <label><IoGameControllerOutline size={13} /> Nickname Game</label>
                        <input type="text" value={user.nickname || user.username} readOnly className="career-form__readonly" />
                        <p className="career-form__hint">Otomatis dari akunmu</p>
                    </div>
                    <div className="career-form__field">
                        <label><IoMailOutline size={13} /> Email</label>
                        <input type="email" value={user.email || '—'} readOnly className="career-form__readonly" />
                        <p className="career-form__hint">Otomatis dari akunmu</p>
                    </div>
                </div>

                {/* ── Discord + Posisi ── */}
                <div className="career-form__row">
                    <div className="career-form__field">
                        <label htmlFor="cf-discord"><IoLogoDiscord size={13} /> Username Discord <span>*</span></label>
                        <input id="cf-discord" type="text" placeholder="username atau @username"
                            value={form.discord} onChange={setField('discord')} maxLength={100} />
                        {errors.discord && <p className="career-form__err">{errors.discord}</p>}
                    </div>
                    <div className="career-form__field">
                        <label htmlFor="cf-position"><IoBriefcaseOutline size={13} /> Posisi yang Dilamar <span>*</span></label>
                        <select id="cf-position" value={form.position} onChange={setField('position')}>
                            <option value="">— Pilih posisi —</option>
                            {openPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                        {openPositions.length === 0 && (
                            <p className="career-form__hint" style={{ color: '#e91e63' }}>Semua posisi sedang ditutup sementara.</p>
                        )}
                        {errors.position && <p className="career-form__err">{errors.position}</p>}
                    </div>
                </div>

                {/* ── Kenapa berminat bergabung ── */}
                <div className="career-form__field">
                    <label htmlFor="cf-whyjoin">
                        <IoHelpCircleOutline size={13} /> Kenapa Kamu Berminat Bergabung Menjadi Staff Tales Hero? <span>*</span>
                        <em>min. 30 karakter</em>
                    </label>
                    <textarea id="cf-whyjoin" rows={4}
                        placeholder="Ceritakan alasan dan motivasimu ingin bergabung menjadi bagian dari tim Tales Hero Indonesia..."
                        value={form.whyJoin} onChange={setField('whyJoin')} maxLength={2000} />
                    <span className="career-form__char">{(form.whyJoin ?? '').length}/2000</span>
                    {errors.whyJoin && <p className="career-form__err">{errors.whyJoin}</p>}
                </div>

                {/* ── Apa yang kamu tawarkan / miliki ── */}
                <div className="career-form__field">
                    <label htmlFor="cf-skills">
                        <IoStarOutline size={13} /> Apa yang Kamu Miliki / Bisa Kamu Tawarkan? <span>*</span>
                        <em>min. 30 karakter</em>
                    </label>
                    <textarea id="cf-skills" rows={4}
                        placeholder="Tuliskan kemampuan, keahlian, atau pengalaman yang relevan dengan posisi yang dilamar..."
                        value={form.whatSkills} onChange={setField('whatSkills')} maxLength={2000} />
                    <span className="career-form__char">{(form.whatSkills ?? '').length}/2000</span>
                    {errors.whatSkills && <p className="career-form__err">{errors.whatSkills}</p>}
                </div>

                {/* ── Mengapa kami harus memilihmu ── */}
                <div className="career-form__field">
                    <label htmlFor="cf-whychoose">
                        <IoPersonCircleOutline size={13} /> Mengapa Kami Harus Memilih Kamu? <span>*</span>
                        <em>min. 30 karakter</em>
                    </label>
                    <textarea id="cf-whychoose" rows={4}
                        placeholder="Jelaskan apa yang membuat kamu berbeda dari kandidat lain dan alasan kami harus memilihmu..."
                        value={form.whyChooseYou} onChange={setField('whyChooseYou')} maxLength={2000} />
                    <span className="career-form__char">{(form.whyChooseYou ?? '').length}/2000</span>
                    {errors.whyChooseYou && <p className="career-form__err">{errors.whyChooseYou}</p>}
                </div>

                {/* ── Pengalaman (optional) ── */}
                <div className="career-form__field">
                    <label htmlFor="cf-experience">
                        <IoDocumentTextOutline size={13} /> Pengalaman Relevan Sebelumnya
                        <em>opsional</em>
                    </label>
                    <textarea id="cf-experience" rows={3}
                        placeholder="Pengalaman di server game lain, komunitas, atau pekerjaan sebelumnya yang relevan..."
                        value={form.experience} onChange={setField('experience')} maxLength={2000} />
                    <span className="career-form__char">{(form.experience ?? '').length}/2000</span>
                </div>

                {/* ── Portfolio (optional) ── */}
                <div className="career-form__field">
                    <label htmlFor="cf-portfolio">
                        <IoLinkOutline size={13} /> Link Portofolio / Sosmed
                        <em>opsional — wajib untuk Graphics Designer & Developer</em>
                    </label>
                    <input id="cf-portfolio" type="text"
                        placeholder="https://behance.net/kamu atau link lainnya"
                        value={form.portfolio} onChange={setField('portfolio')} maxLength={500} />
                </div>

                {/* ── Kesediaan waktu (yes/no) ── */}
                <div className="career-form__field">
                    <label><IoCalendarOutline size={13} /> Apakah kamu siap jika diminta untuk login sesuai waktu yang diminta tim? <span>*</span></label>
                    <div className="career-form__yesno">
                        <button type="button"
                            className={`career-form__yesno-btn${form.isAvailable === true ? ' career-form__yesno-btn--active career-form__yesno-btn--yes' : ''}`}
                            onClick={() => setAvail(true)}>
                            ✅ Ya, Siap
                        </button>
                        <button type="button"
                            className={`career-form__yesno-btn${form.isAvailable === false ? ' career-form__yesno-btn--active career-form__yesno-btn--no' : ''}`}
                            onClick={() => setAvail(false)}>
                            ❌ Tidak
                        </button>
                    </div>
                    {errors.isAvailable && <p className="career-form__err">{errors.isAvailable}</p>}
                </div>

                <button className="career-form__submit" type="submit"
                    disabled={loading || openPositions.length === 0}>
                    {loading
                        ? <><span className="career-form__spinner" /> Mengirim...</>
                        : <><IoBriefcaseOutline size={16} /> Kirim Lamaran</>
                    }
                </button>
            </motion.form>
        );
    };

    return (
        <>
            <Header light />

            {/* ── Hero ── */}
            <section className="career-hero">
                <div className="career-hero__inner">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
                    <motion.h2 className="career-section-title"
                        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                        Posisi yang Tersedia
                    </motion.h2>
                    <motion.p className="career-section-sub"
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.4 }}>
                        Klik kartu untuk melihat detail jobdesk dan kualifikasi masing-masing posisi.
                    </motion.p>
                    <div className="career-grid">
                        {availLoading
                            ? POSITIONS.map((_, i) => <div key={i} className="career-card career-card--skeleton" />)
                            : POSITIONS.map((pos, i) => (
                                <PositionCard key={pos.id} pos={pos} index={i}
                                    available={availability[pos.id] !== false}
                                    onApply={scrollToForm} />
                            ))
                        }
                    </div>
                </div>
            </section>

            {/* ── Application Form ── */}
            <section className="career-apply" id="career-form">
                <div className="career-section-inner career-section-inner--narrow">
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.5 }}>
                        <h2 className="career-section-title">Formulir Lamaran</h2>
                        <p className="career-section-sub">
                            {user
                                ? 'Isi formulir berikut dengan jujur dan lengkap. Kami akan menghubungimu dalam 3–7 hari kerja.'
                                : 'Login terlebih dahulu untuk mengisi formulir lamaran.'}
                        </p>
                        <AnimatePresence mode="wait">
                            <motion.div key={
                                authLoading ? 'loading'
                                : !user ? 'gate'
                                : success ? 'success'
                                : myStatus?.reason ?? 'form'
                            }>
                                {renderFormArea()}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </>
    );
}
