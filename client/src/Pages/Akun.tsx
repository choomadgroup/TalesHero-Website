import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import { useAuth } from '@/Hooks/use-auth';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import {
    IoPersonCircleOutline, IoMailOutline, IoShieldCheckmarkOutline,
    IoLogOutOutline, IoLockClosedOutline, IoEye, IoEyeOff,
    IoCheckmarkCircle, IoGameControllerOutline,
} from 'react-icons/io5';

const CHANGE_PASS_API = '/auth/change-password';

const STARS = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: `${(i * 6.1) % 100}%`,
    top:  `${(i * 7.3) % 90}%`,
    delay:    `${(i * 0.3) % 3}s`,
    duration: `${2 + (i % 4) * 0.5}s`,
    size: `${4 + (i % 4)}px`,
}));

interface ChangeForm { secAnswer: string; newPassword: string; confirm: string; }
interface ChangeErrors { secAnswer?: string; newPassword?: string; confirm?: string; api?: string; }

function validateChange(f: ChangeForm): ChangeErrors {
    const errs: ChangeErrors = {};
    if (!f.secAnswer.trim())     errs.secAnswer   = 'Jawaban keamanan wajib diisi.';
    if (f.newPassword.length < 8) errs.newPassword = 'Kata sandi baru minimal 8 karakter.';
    if (f.newPassword !== f.confirm) errs.confirm  = 'Konfirmasi kata sandi tidak cocok.';
    return errs;
}

export default function Akun() {
    usePageMeta({
        title: 'Akun — Tales Hero Indonesia',
        description: 'Informasi akun game Tales Hero Indonesia-mu.',
    });

    const { user, logout } = useAuth();
    const [, setLocation]  = useLocation();

    const [showForm,     setShowForm]     = useState(false);
    const [showPass,     setShowPass]     = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [passChanged,  setPassChanged]  = useState(false);
    const [form,         setForm]         = useState<ChangeForm>({ secAnswer: '', newPassword: '', confirm: '' });
    const [errors,       setErrors]       = useState<ChangeErrors>({});

    // Redirect ke login kalau belum login
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
                    <div className="akun-card" style={{ textAlign: 'center' }}>
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

    const initial = user.username?.[0]?.toUpperCase() ?? '?';

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
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ username: user.username, secAnswer: form.secAnswer, newPassword: form.newPassword }),
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
        logout();
        setLocation('/');
    };

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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
            >
                <div className="akun-card">
                    {/* Avatar */}
                    <div className="akun-avatar">{initial}</div>
                    <h1 className="akun-username">{user.username}</h1>
                    <p className="akun-gameid">Akun Game Tales Hero Indonesia</p>

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

                    {/* Password changed notice */}
                    <AnimatePresence>
                        {passChanged && (
                            <motion.div
                                className="akun-success-notice"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <IoCheckmarkCircle size={16} />
                                Kata sandi berhasil diubah!
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Change password form */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                className="akun-change-pass"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <p className="akun-change-pass__title">
                                    <IoLockClosedOutline size={14} /> Ubah Kata Sandi
                                </p>
                                {errors.api && <p className="daftar-field__error" style={{ marginBottom: 10 }}>{errors.api}</p>}
                                <form onSubmit={handleChangePass} noValidate>
                                    {/* Sec answer */}
                                    <div className={`daftar-field${errors.secAnswer ? ' daftar-field--error' : ''}`}>
                                        <label className="daftar-field__label">
                                            {user.secQuestion ? `"${user.secQuestion}"` : 'Jawaban Keamanan'}
                                        </label>
                                        <div className="daftar-field__input-wrap">
                                            <IoShieldCheckmarkOutline className="daftar-field__icon" />
                                            <input
                                                type="text"
                                                className="daftar-field__input"
                                                placeholder="Jawaban keamanan kamu"
                                                value={form.secAnswer}
                                                onChange={set('secAnswer')}
                                            />
                                        </div>
                                        {errors.secAnswer && <p className="daftar-field__error">{errors.secAnswer}</p>}
                                    </div>

                                    {/* New password */}
                                    <div className={`daftar-field${errors.newPassword ? ' daftar-field--error' : ''}`}>
                                        <label className="daftar-field__label">Kata Sandi Baru</label>
                                        <div className="daftar-field__input-wrap">
                                            <IoLockClosedOutline className="daftar-field__icon" />
                                            <input
                                                type={showPass ? 'text' : 'password'}
                                                className="daftar-field__input"
                                                placeholder="Min. 8 karakter"
                                                value={form.newPassword}
                                                onChange={set('newPassword')}
                                            />
                                            <button type="button" className="daftar-field__eye" onClick={() => setShowPass(v => !v)}>
                                                {showPass ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                            </button>
                                        </div>
                                        {errors.newPassword && <p className="daftar-field__error">{errors.newPassword}</p>}
                                    </div>

                                    {/* Confirm */}
                                    <div className={`daftar-field${errors.confirm ? ' daftar-field--error' : ''}`}>
                                        <label className="daftar-field__label">Konfirmasi Kata Sandi Baru</label>
                                        <div className="daftar-field__input-wrap">
                                            <IoLockClosedOutline className="daftar-field__icon" />
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                className="daftar-field__input"
                                                placeholder="Ulangi kata sandi baru"
                                                value={form.confirm}
                                                onChange={set('confirm')}
                                            />
                                            <button type="button" className="daftar-field__eye" onClick={() => setShowConfirm(v => !v)}>
                                                {showConfirm ? <IoEyeOff size={18} /> : <IoEye size={18} />}
                                            </button>
                                        </div>
                                        {errors.confirm && <p className="daftar-field__error">{errors.confirm}</p>}
                                    </div>

                                    <div className="akun-form-actions">
                                        <button type="submit" className="akun-btn akun-btn--pink" disabled={loading}>
                                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </button>
                                        <button type="button" className="akun-btn akun-btn--outline" onClick={() => { setShowForm(false); setErrors({}); }}>
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <div className="akun-actions">
                        {!showForm && (
                            <button className="akun-btn akun-btn--pink" onClick={() => { setShowForm(true); setPassChanged(false); }}>
                                <IoLockClosedOutline size={15} /> Ubah Kata Sandi
                            </button>
                        )}
                        <button className="akun-btn akun-btn--outline" onClick={handleLogout}>
                            <IoLogOutOutline size={15} /> Keluar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
        <Footer />
        </>
    );
}
