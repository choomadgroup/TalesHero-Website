import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FormSkeleton from '@/Components/FormSkeleton';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import { useAuth } from '@/Hooks/use-auth';
import { asset } from '@/Lib/utils';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    IoPersonCircleOutline, IoMailOutline, IoShieldCheckmarkOutline,
    IoLogOutOutline, IoLockClosedOutline, IoEye, IoEyeOff,
    IoCheckmarkCircle, IoGameControllerOutline,
    IoCashOutline, IoCreateOutline, IoStarOutline,
    IoIdCardOutline,
} from 'react-icons/io5';

const CHANGE_PASS_API = '/auth/change-password';
const SECURITY_QUESTIONS = [
    'Nama hewan kesayangan kamu?',
    'Warna apa yang kamu suka?',
    'Apa nama panggilan kamu?',
];

const STARS = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${(i * 6.1) % 100}%`,
    top:  `${(i * 7.3) % 90}%`,
    delay:    `${(i * 0.3) % 3}s`,
    duration: `${2 + (i % 4) * 0.5}s`,
    size: `${4 + (i % 4)}px`,
}));

const ALL_CHARACTERS = [
    { name: 'Abel',         file: 'Abel.png',         quote: 'Keberanian sejati bukan soal tanpa rasa takut, tapi tetap melangkah meski takut!' },
    { name: 'BigBo',        file: 'BigBo.png',        quote: 'Ukuranku besar, semangatku jauh lebih besar lagi!' },
    { name: 'Bloody Vera',  file: 'Bloody Vera.png',  quote: 'Merah darah adalah warna kemenanganku. Jangan dekat-dekat!' },
    { name: 'Cain',         file: 'Cain.png',         quote: 'Kegelapan bukan musuhku. Itu adalah senjataku.' },
    { name: 'Celia',        file: 'Celia.png',        quote: 'Senyumku menyimpan kekuatan yang tak pernah kamu duga.' },
    { name: 'Chloe',        file: 'Chloe.png',        quote: 'Setiap bunga punya duri. Aku adalah keduanya.' },
    { name: 'Damyeon',      file: 'Damyeon.png',      quote: 'Disiplin dan tekad — itulah dua senjata terkuatku.' },
    { name: 'Dewi',         file: 'Dewi.png',         quote: 'Alam adalah sekutuku. Bersama kami, tak ada yang mustahil.' },
    { name: 'DnD',          file: 'DnD.png',          quote: 'Bersama kami, tidak ada lawan yang bisa bertahan!' },
    { name: 'Elims',        file: 'Elims.png',        quote: 'Strategiku sempurna. Kekalahanmu sudah kutentukan sejak awal.' },
    { name: 'Harang',       file: 'Harang.png',       quote: 'Tawa dan kemenangan selalu berjalan beriringan bersamaku!' },
    { name: 'Haru',         file: 'Haru.png',         quote: 'Setiap hari adalah kesempatan baru untuk jadi lebih kuat.' },
    { name: 'Hidden Rough', file: 'Hidden Rough.png', quote: 'Tersembunyi bukan berarti lemah. Waspadai bayanganmu!' },
    { name: 'Jab',          file: 'Jab.png',          quote: 'Pukulanku cepat, tepat, dan tidak akan pernah terhindarkan!' },
    { name: 'Jaka',         file: 'Jaka.png',         quote: 'Dari desa kecil, mimpi besarku takkan pernah padam!' },
    { name: 'Kai',          file: 'Kai.png',          quote: 'Kecepatan adalah segalanya. Berkedip, kamu sudah kalah.' },
    { name: 'LaLa',         file: 'LaLa.png',         quote: 'Melodi indahku bisa menjadi senjata paling mematikan!' },
    { name: 'Luci',         file: 'Luci.png',         quote: 'Cahaya atau kegelapan? Aku memilih jalanku sendiri.' },
    { name: 'Maki',         file: 'Maki.png',         quote: 'Ketangkasanku tak tertandingi di medan perang manapun.' },
    { name: 'Miho',         file: 'Miho.png',         quote: 'Percayakan keselamatanmu padaku. Aku tak akan mengecewakan.' },
    { name: 'Mingming',     file: 'Mingming.png',     quote: 'Kecil bukan halangan. Semangatku selalu raksasa!' },
    { name: 'Narcius',      file: 'Narcius.png',      quote: 'Cermin pun kagum melihat kehebatan yang kumiliki.' },
    { name: 'R',            file: 'R.png',            quote: 'Misi diterima. Eksekusi dimulai. Kegagalan bukan opsi.' },
    { name: 'Rina',         file: 'Rina.png',         quote: 'Musikku adalah mantera. Dengarkan dan rasakan kekuatannya!' },
    { name: 'Rini',         file: 'Rini.png',         quote: 'Langkah kecilku adalah awal dari perjalanan yang panjang.' },
    { name: 'Roroa',        file: 'Roroa.png',        quote: 'Petualangan sejati dimulai saat rasa takut berhasil dikalahkan!' },
    { name: 'Rough',        file: 'Rough.png',        quote: 'Kasar di luar, tapi hatiku selalu ada untuk melindungi tim!' },
    { name: 'Sid',          file: 'Sid.png',          quote: 'Ketepatan setiap seranganku adalah mahkota kebanggaanku.' },
    { name: 'Siho',         file: 'Siho.png',         quote: 'Ketenangan dalam badai adalah kekuatanku yang sesungguhnya.' },
    { name: 'Tifanny',      file: 'Tifanny.png',      quote: 'Pesonaku membuat lawan lengah — lalu kutaklukkan mereka!' },
    { name: 'Vera',         file: 'Vera.png',         quote: 'Anggun di luar, mematikan di dalam. Jangan salah menilai!' },
    { name: 'Wukong',       file: 'Wukong.png',       quote: 'Kekuatan legendaris bersemayam dalam setiap gerakanku!' },
    { name: 'Xionell',      file: 'Xionell.png',      quote: 'Keunikanku adalah kekuatanku yang paling tak terduga.' },
    { name: 'YeonOh',       file: 'YeonOh.png',       quote: 'Setiap langkah adalah tarian, setiap tarian adalah kemenangan.' },
];

const CHARS_WITH_ART = new Set([
    'Abel','BigBo','Bloody Vera','Cain','Celia','Chloe','Damyeon','Dewi','DnD',
    'Elims','Harang','Haru','Hidden Rough','Jab','Jaka','Kai','LaLa','Luci',
    'Maki','Miho','Mingming','Narcius','R','Rina','Rini','Roroa','Rough',
    'Sid','Siho','Tifanny','Vera','Wukong','Xionell','YeonOh',
]);

type SettingsTab = 'profil' | 'keamanan' | 'sesi';

interface ChangeForm   { secAnswer: string; newPassword: string; confirm: string; }
interface ChangeErrors { secAnswer?: string; newPassword?: string; confirm?: string; api?: string; }

function validateChange(f: ChangeForm): ChangeErrors {
    const errs: ChangeErrors = {};
    if (!f.secAnswer.trim())         errs.secAnswer   = 'Jawaban keamanan wajib diisi.';
    if (f.newPassword.length < 8)    errs.newPassword = 'Kata sandi baru minimal 8 karakter.';
    if (f.newPassword !== f.confirm) errs.confirm     = 'Konfirmasi kata sandi tidak cocok.';
    return errs;
}

export default function Akun() {
    usePageMeta({
        title: 'Akun — Tales Hero Indonesia',
        description: 'Informasi akun game Tales Hero Indonesia-mu.',
    });

    const { user, loading: authLoading, logout, updateUser } = useAuth();
    const [, setLocation] = useLocation();

    const charData = (user?.character && CHARS_WITH_ART.has(user.character))
        ? ALL_CHARACTERS.find(c => c.name === user.character) ?? null
        : null;

    // ── Tabs ─────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<SettingsTab>('profil');

    // ── Form states ──────────────────────────────────────────
    const [showForm,     setShowForm]     = useState(false);
    const [showPass,     setShowPass]     = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [passChanged,  setPassChanged]  = useState(false);
    const [form,         setForm]         = useState<ChangeForm>({ secAnswer: '', newPassword: '', confirm: '' });
    const [errors,       setErrors]       = useState<ChangeErrors>({});

    const [profileForm,     setProfileForm]     = useState({ username: '', email: '' });
    const [profilePassword, setProfilePassword] = useState('');
    const [profileLoading,  setProfileLoading]  = useState(false);
    const [profileMessage,  setProfileMessage]  = useState('');
    const [profileError,    setProfileError]    = useState('');

    const [securityForm,     setSecurityForm]     = useState({ question: '', answer: '' });
    const [securityPassword, setSecurityPassword] = useState('');
    const [securityLoading,  setSecurityLoading]  = useState(false);
    const [securityMessage,  setSecurityMessage]  = useState('');
    const [securityError,    setSecurityError]    = useState('');

    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (user) setProfileForm({ username: user.username, email: user.email });
    }, [user?.username, user?.email]);

    // ── Loading / guest ───────────────────────────────────────
    if (authLoading) {
        return (
            <>
            <Header />
            <div className="cs-page cs-page--login">
                <div className="cs-page__card cs-page__card--account">
                    <FormSkeleton rows={3} label="Memeriksa sesi..." />
                </div>
            </div>
            <Footer />
            </>
        );
    }

    if (!user) {
        return (
            <>
            <Header />
            <div className="cs-page cs-page--login">
                <div className="cs-page__bg">
                    {STARS.map(s => (
                        <span key={s.id} className="cs-page__star" style={{
                            left: s.left, top: s.top,
                            width: s.size, height: s.size,
                            animationDelay: s.delay, animationDuration: s.duration,
                        }} />
                    ))}
                </div>
                <motion.div className="cs-page__card"
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                    <div className="akun-card akun-card--guest" style={{ textAlign: 'center' }}>
                        <IoPersonCircleOutline size={56} color="#ccc" />
                        <p style={{ margin: '16px 0 8px', fontWeight: 700, color: '#1a1a2e' }}>Kamu belum login</p>
                        <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Masuk dulu untuk melihat info akun.</p>
                        <button className="akun-btn akun-btn--pink" onClick={() => setLocation('/login')}>
                            <IoPersonCircleOutline size={16} /> Masuk Sekarang
                        </button>
                    </div>
                </motion.div>
            </div>
            <Footer />
            </>
        );
    }

    // ── Handlers ──────────────────────────────────────────────
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage('');
        setProfileError('');
        try {
            const res = await fetch('/auth/update-profile', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: profilePassword, email: profileForm.email.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setProfileError(data?.message ?? 'Profil gagal diperbarui.'); return; }
            updateUser({ username: user.username, email: data.user?.email ?? profileForm.email.trim(), secQuestion: data.user?.secQuestion ?? user.secQuestion });
            setProfilePassword('');
            setProfileMessage(data?.message ?? 'Profil berhasil diperbarui.');
        } catch {
            setProfileError('Tidak dapat terhubung ke server.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityLoading(true);
        setSecurityMessage('');
        setSecurityError('');
        try {
            const res = await fetch('/auth/update-profile', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: securityPassword, email: user.email, secQuestion: securityForm.question, secAnswer: securityForm.answer }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setSecurityError(data?.message ?? 'Pertanyaan keamanan gagal disimpan.'); return; }
            updateUser({ secQuestion: data.user?.secQuestion ?? securityForm.question });
            setSecurityForm({ question: '', answer: '' });
            setSecurityPassword('');
            setSecurityMessage(data?.message ?? 'Pertanyaan keamanan berhasil disimpan.');
        } catch {
            setSecurityError('Tidak dapat terhubung ke server.');
        } finally {
            setSecurityLoading(false);
        }
    };

    const set = (key: keyof ChangeForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(err => ({ ...err, [key]: undefined }));
    };

    const handleChangePass = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validateChange(form);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setLoading(true);
        setErrors({});
        try {
            const res = await fetch(CHANGE_PASS_API, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secAnswer: form.secAnswer, newPassword: form.newPassword }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErrors({ api: data?.message ?? 'Gagal mengubah kata sandi.' });
            } else {
                setPassChanged(true);
                setShowForm(false);
                setForm({ secAnswer: '', newPassword: '', confirm: '' });
            }
        } catch {
            setErrors({ api: 'Tidak dapat terhubung ke server.' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setLoggingOut(true);
        setTimeout(() => { logout(); setLocation('/'); }, 800);
    };

    // ── Render ────────────────────────────────────────────────
    return (
        <>
        <Header />
        <div className="cs-page cs-page--account">
            <motion.div
                className="cs-page__card cs-page__card--account"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
            >
                <AnimatePresence mode="wait">
                {loggingOut ? (
                    <div key="logout-skeleton" style={{ padding: '8px 0', width: '100%' }}>
                        <FormSkeleton variant="logout" label="Sedang keluar..." />
                    </div>
                ) : (
                <div key="akun-content" className="akun-v2">

                    {/* ═══ HERO BANNER ═══ */}
                    <div className="akun-hero-banner">
                        {/* decorative bg glow */}
                        <div className="akun-hero-banner__glow" />

                        {/* Left: identity + stats */}
                        <div className="akun-hero-banner__left">

                            {/* Avatar */}
                            <div className="akun-hero-banner__avatar-wrap">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={charData?.name ?? 'default'}
                                        src={charData
                                            ? asset(`/Image/Karakter/Avatar/${charData.file}`)
                                            : asset('/Image/Account/IMG-DEFAULT-01.png')}
                                        alt={charData?.name ?? 'Avatar'}
                                        className="akun-hero-banner__avatar"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        onError={e => {
                                            (e.currentTarget as HTMLImageElement).src =
                                                asset('/Image/Account/IMG-DEFAULT-01.png');
                                        }}
                                    />
                                </AnimatePresence>
                            </div>

                            {/* Identity text */}
                            <div className="akun-hero-banner__identity">
                                <span className="akun-hero-banner__eyebrow">✦ Halo! Aku dikenal</span>
                                <h1 className="akun-hero-banner__nick">{user.nickname || user.username}</h1>
                                {charData && (
                                    <span className="akun-hero-banner__charname">{charData.name}</span>
                                )}

                                {/* EXP bar — inline: Lv. X [====] XX% */}
                                <div className="akun-hero-banner__exp">
                                    <span className="akun-hero-banner__exp-lv">Lv. {user.level}</span>
                                    <div className="akun-hero-banner__exp-track">
                                        <motion.div
                                            className="akun-hero-banner__exp-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${user.expPct}%` }}
                                            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                                        />
                                    </div>
                                    <span className="akun-hero-banner__exp-pct">{user.expPct.toFixed(1)}%</span>
                                </div>

                                {/* Currency chips */}
                                <div className="akun-hero-banner__chips">
                                    <div className="akun-hero-banner__chip akun-hero-banner__chip--cash">
                                        <IoCashOutline size={12} />
                                        <span className="akun-hero-banner__chip-label">Cash</span>
                                        <strong>{Number(user.cash ?? 0).toLocaleString('id-ID')}</strong>
                                    </div>
                                    <div className="akun-hero-banner__chip akun-hero-banner__chip--tr">
                                        <IoGameControllerOutline size={12} />
                                        <span className="akun-hero-banner__chip-label">TR</span>
                                        <strong>{Number(user.tr ?? 0).toLocaleString('id-ID')}</strong>
                                    </div>
                                    <div className="akun-hero-banner__chip akun-hero-banner__chip--mau">
                                        <IoStarOutline size={12} />
                                        <span className="akun-hero-banner__chip-label">MAU</span>
                                        <strong>{Number(user.mau ?? 0).toLocaleString('id-ID')}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ═══ BODY: info panel + settings ═══ */}
                    <div className="akun-v2-body">

                        {/* Left: info panel */}
                        <div className="akun-info-panel">
                            <p className="akun-info-panel__title">
                                <IoIdCardOutline size={14} /> Info Akun
                            </p>

                            {user.gameId != null && (
                                <div className="akun-info-panel__row">
                                    <span className="akun-info-panel__label">
                                        <IoGameControllerOutline size={11} /> Game ID
                                    </span>
                                    <span className="akun-info-panel__value">{user.gameId || '—'}</span>
                                </div>
                            )}
                            {user.email && (
                                <div className="akun-info-panel__row">
                                    <span className="akun-info-panel__label">
                                        <IoMailOutline size={11} /> Email
                                    </span>
                                    <span className="akun-info-panel__value">{user.email}</span>
                                </div>
                            )}
                            {user.secQuestion && (
                                <div className="akun-info-panel__row">
                                    <span className="akun-info-panel__label">
                                        <IoShieldCheckmarkOutline size={11} /> Pertanyaan Keamanan
                                    </span>
                                    <span className="akun-info-panel__value">{user.secQuestion}</span>
                                </div>
                            )}

                            {/* Character quote */}
                            {charData && (
                                <blockquote className="akun-info-panel__quote">
                                    "{charData.quote}"
                                </blockquote>
                            )}
                        </div>

                        {/* Right: settings with tabs */}
                        <div className="akun-settings-v2">

                            {/* Tab bar */}
                            <div className="akun-tabs" role="tablist">
                                {([
                                    { id: 'profil',   label: 'Profil',    icon: <IoCreateOutline size={14} /> },
                                    { id: 'keamanan', label: 'Keamanan',  icon: <IoShieldCheckmarkOutline size={14} /> },
                                    { id: 'sesi',     label: 'Sesi',      icon: <IoLogOutOutline size={14} /> },
                                ] as { id: SettingsTab; label: string; icon: React.ReactNode }[]).map(tab => (
                                    <button
                                        key={tab.id}
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                        className={`akun-tab-btn${activeTab === tab.id ? ' akun-tab-btn--active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab panels */}
                            <AnimatePresence mode="wait">

                            {/* ── PROFIL ── */}
                            {activeTab === 'profil' && (
                                <motion.div key="profil"
                                    className="akun-tab-panel"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}>

                                    <form className="akun-profile-form" onSubmit={handleProfileSubmit}>
                                        <p className="akun-section-title"><IoCreateOutline size={14} /> Edit Profil</p>
                                        {profileError   && <p className="akun-inline-error">{profileError}</p>}
                                        {profileMessage && <p className="akun-inline-success"><IoCheckmarkCircle size={14} /> {profileMessage}</p>}

                                        <label className="akun-input-label" htmlFor="akun-username">Username</label>
                                        <input id="akun-username" className="akun-input" value={profileForm.username} disabled readOnly />
                                        <p className="akun-lock-note">Username tidak dapat diubah setelah akun didaftarkan.</p>

                                        {user.email ? (
                                            <>
                                                <label className="akun-input-label">Email</label>
                                                <div className="akun-locked-value"><IoMailOutline size={14} /> {user.email}</div>
                                                <p className="akun-lock-note">Email sudah terdaftar dan tidak dapat diubah, Mungkin dapat diubah di pembaruan berikutnya.</p>
                                            </>
                                        ) : (
                                            <>
                                                <label className="akun-input-label" htmlFor="akun-email">Email</label>
                                                <input id="akun-email" className="akun-input" type="email"
                                                    value={profileForm.email}
                                                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                                                    autoComplete="email" placeholder="Masukkan email kamu" />
                                                <label className="akun-input-label" htmlFor="akun-email-password">Kata Sandi Saat Ini</label>
                                                <input id="akun-email-password" className="akun-input" type="password"
                                                    value={profilePassword}
                                                    onChange={e => setProfilePassword(e.target.value)}
                                                    placeholder="Untuk konfirmasi keamanan" autoComplete="current-password" />
                                                <button className="akun-btn akun-btn--pink" type="submit"
                                                    disabled={profileLoading || !profileForm.email.trim()}>
                                                    {profileLoading ? 'Menyimpan...' : 'Simpan Email'}
                                                </button>
                                            </>
                                        )}
                                    </form>
                                </motion.div>
                            )}

                            {/* ── KEAMANAN ── */}
                            {activeTab === 'keamanan' && (
                                <motion.div key="keamanan"
                                    className="akun-tab-panel"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}>

                                    {/* Security question — only if not set */}
                                    {!user.secQuestion && (
                                        <form className="akun-profile-form" onSubmit={handleSecuritySubmit}>
                                            <p className="akun-section-title"><IoShieldCheckmarkOutline size={14} /> Atur Pertanyaan Keamanan</p>
                                            <p className="akun-form-hint">Pertanyaan ini hanya dapat diatur satu kali dan akan digunakan untuk reset kata sandi.</p>
                                            {securityError   && <p className="akun-inline-error">{securityError}</p>}
                                            {securityMessage && <p className="akun-inline-success"><IoCheckmarkCircle size={14} /> {securityMessage}</p>}
                                            <label className="akun-input-label" htmlFor="akun-security-question">Pilih Pertanyaan</label>
                                            <select id="akun-security-question" className="akun-input"
                                                value={securityForm.question}
                                                onChange={e => setSecurityForm(f => ({ ...f, question: e.target.value }))} required>
                                                <option value="">— Pilih pertanyaan —</option>
                                                {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                            </select>
                                            <label className="akun-input-label" htmlFor="akun-security-answer">Jawaban</label>
                                            <input id="akun-security-answer" className="akun-input"
                                                value={securityForm.answer}
                                                onChange={e => setSecurityForm(f => ({ ...f, answer: e.target.value }))}
                                                placeholder="Masukkan jawaban kamu" required />
                                            <label className="akun-input-label" htmlFor="akun-security-password">Kata Sandi Saat Ini</label>
                                            <input id="akun-security-password" className="akun-input" type="password"
                                                value={securityPassword}
                                                onChange={e => setSecurityPassword(e.target.value)}
                                                placeholder="Untuk konfirmasi keamanan" autoComplete="current-password" required />
                                            <button className="akun-btn akun-btn--pink" type="submit" disabled={securityLoading}>
                                                {securityLoading ? 'Menyimpan...' : 'Simpan Pertanyaan'}
                                            </button>
                                        </form>
                                    )}

                                    {/* Change password */}
                                    <div className="akun-profile-form">
                                        <p className="akun-section-title"><IoLockClosedOutline size={14} /> Ubah Kata Sandi</p>

                                        <AnimatePresence>
                                        {passChanged && (
                                            <motion.div className="akun-success-notice"
                                                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                <IoCheckmarkCircle size={16} /> Kata sandi berhasil diubah!
                                            </motion.div>
                                        )}
                                        </AnimatePresence>

                                        <AnimatePresence>
                                        {showForm && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                style={{ overflow: 'hidden' }}>
                                                {errors.api && <p className="daftar-field__error" style={{ marginBottom: 10 }}>{errors.api}</p>}
                                                <form onSubmit={handleChangePass} noValidate>
                                                    <div className={`daftar-field${errors.secAnswer ? ' daftar-field--error' : ''}`}>
                                                        <label className="daftar-field__label">
                                                            {user.secQuestion ? `"${user.secQuestion}"` : 'Jawaban Keamanan'}
                                                        </label>
                                                        <div className="daftar-field__input-wrap">
                                                            <IoShieldCheckmarkOutline className="daftar-field__icon" />
                                                            <input type="text" className="daftar-field__input"
                                                                placeholder="Jawaban keamanan kamu"
                                                                value={form.secAnswer} onChange={set('secAnswer')} />
                                                        </div>
                                                        {errors.secAnswer && <p className="daftar-field__error">{errors.secAnswer}</p>}
                                                    </div>
                                                    <div className={`daftar-field${errors.newPassword ? ' daftar-field--error' : ''}`}>
                                                        <label className="daftar-field__label">Kata Sandi Baru</label>
                                                        <div className="daftar-field__input-wrap">
                                                            <IoLockClosedOutline className="daftar-field__icon" />
                                                            <input type={showPass ? 'text' : 'password'} className="daftar-field__input"
                                                                placeholder="Min. 8 karakter" value={form.newPassword} onChange={set('newPassword')} />
                                                            <button type="button" className="daftar-field__eye" onClick={() => setShowPass(v => !v)}>
                                                                {showPass ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                                            </button>
                                                        </div>
                                                        {errors.newPassword && <p className="daftar-field__error">{errors.newPassword}</p>}
                                                    </div>
                                                    <div className={`daftar-field${errors.confirm ? ' daftar-field--error' : ''}`}>
                                                        <label className="daftar-field__label">Konfirmasi Kata Sandi Baru</label>
                                                        <div className="daftar-field__input-wrap">
                                                            <IoLockClosedOutline className="daftar-field__icon" />
                                                            <input type={showConfirm ? 'text' : 'password'} className="daftar-field__input"
                                                                placeholder="Ulangi kata sandi baru" value={form.confirm} onChange={set('confirm')} />
                                                            <button type="button" className="daftar-field__eye" onClick={() => setShowConfirm(v => !v)}>
                                                                {showConfirm ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                                            </button>
                                                        </div>
                                                        {errors.confirm && <p className="daftar-field__error">{errors.confirm}</p>}
                                                        <button type="button" className="login-forgot__link"
                                                            style={{ display: 'block', marginTop: '6px', textAlign: 'right', width: '100%' }}
                                                            onClick={() => setLocation('/forgot-password')}>
                                                            Lupa Pertanyaan Keamanan?
                                                        </button>
                                                    </div>
                                                    <div className="akun-form-actions">
                                                        <button type="submit" className="akun-btn akun-btn--pink" disabled={loading}>
                                                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                                        </button>
                                                        <button type="button" className="akun-btn akun-btn--outline"
                                                            onClick={() => { setShowForm(false); setErrors({}); }}>
                                                            Batal
                                                        </button>
                                                    </div>
                                                </form>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>

                                        {!showForm && (
                                            <button className="akun-btn akun-btn--outline akun-btn--block" style={{ marginTop: 4 }}
                                                onClick={() => { setShowForm(true); setPassChanged(false); }}>
                                                <IoLockClosedOutline size={15} /> Ubah Kata Sandi
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── SESI ── */}
                            {activeTab === 'sesi' && (
                                <motion.div key="sesi"
                                    className="akun-tab-panel"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}>

                                    <div className="akun-profile-form">
                                        <p className="akun-section-title"><IoLogOutOutline size={14} /> Sesi Aktif</p>
                                        <p style={{ fontSize: 13, color: '#6a7494', marginBottom: 20, lineHeight: 1.6 }}>
                                            Kamu sedang masuk sebagai <strong style={{ color: '#c8d0ff' }}>{user.nickname || user.username}</strong>.
                                            Klik tombol di bawah untuk keluar dari akun ini.
                                        </p>
                                        <button className="akun-btn akun-btn--logout" onClick={handleLogout}>
                                            <IoLogOutOutline size={16} /> Keluar dari Akun
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            </AnimatePresence>
                        </div>
                    </div>

                </div>
                )}
                </AnimatePresence>
            </motion.div>
        </div>
        <Footer />
        </>
    );
}
