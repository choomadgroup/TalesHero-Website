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
    IoSwapHorizontalOutline, IoCloseOutline, IoSearchOutline,
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

// Only characters with confirmed art files
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
];

const CHAR_KEY = 'taleshero_selected_char';

interface ChangeForm { secAnswer: string; newPassword: string; confirm: string; }
interface ChangeErrors { secAnswer?: string; newPassword?: string; confirm?: string; api?: string; }

function validateChange(f: ChangeForm): ChangeErrors {
    const errs: ChangeErrors = {};
    if (!f.secAnswer.trim())      errs.secAnswer   = 'Jawaban keamanan wajib diisi.';
    if (f.newPassword.length < 8) errs.newPassword = 'Kata sandi baru minimal 8 karakter.';
    if (f.newPassword !== f.confirm) errs.confirm  = 'Konfirmasi kata sandi tidak cocok.';
    return errs;
}

export default function Akun() {
    usePageMeta({
        title: 'Akun — Tales Hero Indonesia',
        description: 'Informasi akun game Tales Hero Indonesia-mu.',
    });

    const { user, loading: authLoading, logout, updateUser } = useAuth();
    const [, setLocation]  = useLocation();

    // Character picker
    const [charIdx, setCharIdx] = useState<number>(() => {
        const stored = localStorage.getItem(CHAR_KEY);
        const n = stored !== null ? parseInt(stored, 10) : -1;
        if (n >= 0 && n < ALL_CHARACTERS.length) return n;
        return Math.floor(Math.random() * ALL_CHARACTERS.length);
    });
    const [showCharPicker, setShowCharPicker] = useState(false);
    const [charSearch, setCharSearch] = useState('');

    const selectChar = (idx: number) => {
        setCharIdx(idx);
        localStorage.setItem(CHAR_KEY, String(idx));
        setShowCharPicker(false);
        setCharSearch('');
    };

    const filteredChars = ALL_CHARACTERS.filter(c =>
        c.name.toLowerCase().includes(charSearch.toLowerCase())
    );

    // Form states
    const [showForm,     setShowForm]     = useState(false);
    const [showPass,     setShowPass]     = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [passChanged,  setPassChanged]  = useState(false);
    const [form,         setForm]         = useState<ChangeForm>({ secAnswer: '', newPassword: '', confirm: '' });
    const [errors,       setErrors]       = useState<ChangeErrors>({});
    const [profileForm,    setProfileForm]    = useState({ username: '', email: '' });
    const [profilePassword, setProfilePassword] = useState('');
    const [profileLoading,  setProfileLoading]  = useState(false);
    const [profileMessage,  setProfileMessage]  = useState('');
    const [profileError,    setProfileError]    = useState('');
    const [securityForm,    setSecurityForm]    = useState({ question: '', answer: '' });
    const [securityPassword, setSecurityPassword] = useState('');
    const [securityLoading,  setSecurityLoading]  = useState(false);
    const [securityMessage,  setSecurityMessage]  = useState('');
    const [securityError,    setSecurityError]    = useState('');
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (user) setProfileForm({ username: user.username, email: user.email });
    }, [user?.username, user?.email]);

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
                <motion.div
                    className="cs-page__card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                >
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

    const char = ALL_CHARACTERS[charIdx];

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

            <motion.div
                className="cs-page__card cs-page__card--account"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
            >
                <AnimatePresence mode="wait">
                {loggingOut ? (
                    <div key="logout-skeleton" style={{ padding: '8px 0' }}>
                        <FormSkeleton variant="logout" label="Sedang keluar..." />
                    </div>
                ) : (
                <div key="akun-content" className="akun-layout">

                    {/* ═══ LEFT — Character Showcase ═══ */}
                    <div className="akun-showcase">

                        {/* Character art panel */}
                        <div className="akun-char-panel">
                            <div className="akun-char-panel__bg" />
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={charIdx}
                                    src={asset(`/Image/Karakter/Art/${char.file}`)}
                                    alt={char.name}
                                    className="akun-char-panel__img"
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.38, ease: 'easeOut' }}
                                />
                            </AnimatePresence>
                            <div className="akun-char-panel__overlay">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`name-${charIdx}`}
                                        className="akun-char-panel__info"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.28 }}
                                    >
                                        <span className="akun-char-panel__label">Karakter</span>
                                        <h2 className="akun-char-panel__name">{char.name}</h2>
                                        <p className="akun-char-panel__quote">"{char.quote}"</p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <button
                                className="akun-char-panel__change-btn"
                                onClick={() => setShowCharPicker(true)}
                                title="Ganti karakter"
                            >
                                <IoSwapHorizontalOutline size={14} />
                                Ganti Karakter
                            </button>
                        </div>

                        {/* Player identity */}
                        <div className="akun-player-card">
                            <div className="akun-player-card__nick">
                                <span className="akun-player-card__label">Nickname</span>
                                <strong className="akun-player-card__value">{user.nickname || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Belum ada nickname</span>}</strong>
                            </div>
                            <div className="akun-player-card__sep" />
                            <div className="akun-player-card__nick">
                                <span className="akun-player-card__label">Username</span>
                                <strong className="akun-player-card__value">{user.username}</strong>
                            </div>
                        </div>

                        {/* Balance grid */}
                        <div className="akun-balance-grid">
                            <div className="akun-balance-card akun-balance-card--cash">
                                <span className="akun-balance-card__label"><IoCashOutline size={13} /> Cash</span>
                                <strong>{Number(user.cash ?? 0).toLocaleString('id-ID')}</strong>
                            </div>
                            <div className="akun-balance-card akun-balance-card--tr">
                                <span className="akun-balance-card__label"><IoGameControllerOutline size={13} /> TR</span>
                                <strong>{Number(user.tr ?? 0).toLocaleString('id-ID')}</strong>
                            </div>
                            <div className="akun-balance-card akun-balance-card--mau">
                                <span className="akun-balance-card__label"><IoStarOutline size={13} /> MAU</span>
                                <strong>{Number(user.mau ?? 0).toLocaleString('id-ID')}</strong>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div className="akun-info">
                            {user.email && (
                                <div className="akun-info__row">
                                    <span className="akun-info__label"><IoMailOutline size={11} /> Email</span>
                                    <span className="akun-info__value">{user.email}</span>
                                </div>
                            )}
                            {user.secQuestion && (
                                <div className="akun-info__row">
                                    <span className="akun-info__label"><IoShieldCheckmarkOutline size={11} /> Pertanyaan Keamanan</span>
                                    <span className="akun-info__value">{user.secQuestion}</span>
                                </div>
                            )}
                            {user.gameId != null && (
                                <div className="akun-info__row">
                                    <span className="akun-info__label"><IoGameControllerOutline size={11} /> Game ID</span>
                                    <span className="akun-info__value">{user.gameId || '—'}</span>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* ═══ RIGHT — Settings ═══ */}
                    <div className="akun-settings">

                        {/* Edit profil */}
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
                                    <p className="akun-lock-note">Email sudah terdaftar dan tidak dapat diubah.</p>
                                </>
                            ) : (
                                <>
                                    <label className="akun-input-label" htmlFor="akun-email">Email</label>
                                    <input id="akun-email" className="akun-input" type="email" value={profileForm.email}
                                        onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                                        autoComplete="email" placeholder="Masukkan email kamu" />
                                    <label className="akun-input-label" htmlFor="akun-email-password">Kata Sandi Saat Ini</label>
                                    <input id="akun-email-password" className="akun-input" type="password" value={profilePassword}
                                        onChange={e => setProfilePassword(e.target.value)}
                                        placeholder="Untuk konfirmasi keamanan" autoComplete="current-password" />
                                    <button className="akun-btn akun-btn--pink" type="submit" disabled={profileLoading || !profileForm.email.trim()}>
                                        {profileLoading ? 'Menyimpan...' : 'Simpan Email'}
                                    </button>
                                </>
                            )}
                        </form>

                        {/* Security question (only if not set) */}
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
                                <input id="akun-security-answer" className="akun-input" value={securityForm.answer}
                                    onChange={e => setSecurityForm(f => ({ ...f, answer: e.target.value }))}
                                    placeholder="Masukkan jawaban kamu" required />
                                <label className="akun-input-label" htmlFor="akun-security-password">Kata Sandi Saat Ini</label>
                                <input id="akun-security-password" className="akun-input" type="password" value={securityPassword}
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
                                    style={{ overflow: 'hidden' }}
                                >
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

                        {/* Logout */}
                        <button className="akun-btn akun-btn--logout" onClick={handleLogout}>
                            <IoLogOutOutline size={16} /> Keluar dari Akun
                        </button>

                    </div>
                </div>
                )}
                </AnimatePresence>
            </motion.div>
        </div>

        {/* ═══ Character Picker Modal ═══ */}
        <AnimatePresence>
        {showCharPicker && (
            <motion.div
                className="akun-char-picker-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowCharPicker(false); setCharSearch(''); }}
            >
                <motion.div
                    className="akun-char-picker"
                    initial={{ opacity: 0, scale: 0.93, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="akun-char-picker__header">
                        <h3 className="akun-char-picker__title">Pilih Karakter</h3>
                        <button className="akun-char-picker__close" onClick={() => { setShowCharPicker(false); setCharSearch(''); }}>
                            <IoCloseOutline size={22} />
                        </button>
                    </div>
                    <div className="akun-char-picker__search-wrap">
                        <IoSearchOutline size={15} className="akun-char-picker__search-icon" />
                        <input
                            className="akun-char-picker__search"
                            placeholder="Cari karakter..."
                            value={charSearch}
                            onChange={e => setCharSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="akun-char-picker__grid">
                        {filteredChars.map((c, i) => {
                            const realIdx = ALL_CHARACTERS.indexOf(c);
                            return (
                                <button
                                    key={c.name}
                                    className={`akun-char-picker__item${realIdx === charIdx ? ' akun-char-picker__item--active' : ''}`}
                                    onClick={() => selectChar(realIdx)}
                                    title={c.name}
                                >
                                    <div className="akun-char-picker__item-img-wrap">
                                        <img
                                            src={asset(`/Image/Karakter/Art/${c.file}`)}
                                            alt={c.name}
                                            loading="lazy"
                                        />
                                        {realIdx === charIdx && (
                                            <span className="akun-char-picker__item-check">
                                                <IoCheckmarkCircle size={16} />
                                            </span>
                                        )}
                                    </div>
                                    <span className="akun-char-picker__item-name">{c.name}</span>
                                </button>
                            );
                        })}
                        {filteredChars.length === 0 && (
                            <p className="akun-char-picker__empty">Karakter "{charSearch}" tidak ditemukan.</p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        <Footer />
        </>
    );
}
