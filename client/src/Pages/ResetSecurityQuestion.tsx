import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { usePageMeta } from '@/Hooks/use-page-meta';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { IoArrowBack, IoCheckmarkCircle, IoShieldCheckmarkOutline } from 'react-icons/io5';

const RESET_API = '/auth/email-reset-security';

const QUESTIONS = [
    'Nama hewan kesayangan kamu?',
    'Warna apa yang kamu suka?',
    'Apa nama panggilan kamu?',
];

export default function ResetSecurityQuestion() {
    usePageMeta({
        title: 'Reset Pertanyaan Keamanan — Tales Hero Indonesia',
        description: 'Atur ulang pertanyaan keamanan akun Tales Hero Indonesia.',
    });

    const [, setLocation] = useLocation();
    const [token, setToken]           = useState('');
    const [secQuestion, setSecQuestion] = useState('');
    const [secAnswer, setSecAnswer]   = useState('');
    const [loading, setLoading]       = useState(false);
    const [success, setSuccess]       = useState(false);
    const [error, setError]           = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token') ?? '';
        if (!t) setError('Link tidak valid. Silakan minta link baru.');
        setToken(t);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!secQuestion)        { setError('Pilih pertanyaan keamanan.'); return; }
        if (!secAnswer.trim())   { setError('Jawaban wajib diisi.'); return; }

        setLoading(true);
        setError('');
        try {
            const res = await fetch(RESET_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, secQuestion, secAnswer }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setError(data?.message ?? 'Gagal memperbarui pertanyaan keamanan.'); return; }
            setSuccess(true);
        } catch {
            setError('Tidak dapat terhubung ke server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="cs-page cs-page--login">
                <div className="cs-page__bg" />
                <motion.div
                    className="cs-page__card login-form-card"
                    initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                    <div className="login-form-wrap reset-form-wrap">
                        {success ? (
                            <div className="reset-success">
                                <IoCheckmarkCircle size={54} />
                                <h1 className="login-form-wrap__title">Pertanyaan Keamanan Diperbarui!</h1>
                                <p className="login-form-wrap__sub">Pertanyaan keamanan akunmu sudah berhasil diubah.</p>
                                <button className="daftar-submit" onClick={() => setLocation('/login')}>
                                    Kembali ke Login
                                </button>
                            </div>
                        ) : (
                            <>
                                <button className="reset-back" onClick={() => setLocation('/forgot-password')}>
                                    <IoArrowBack size={15} /> Kembali
                                </button>
                                <div className="reset-heading-icon"><IoShieldCheckmarkOutline size={26} /></div>
                                <h1 className="login-form-wrap__title">Atur Pertanyaan Keamanan Baru</h1>
                                <p className="login-form-wrap__sub">Pilih pertanyaan dan jawaban baru untuk akunmu.</p>
                                {error && <div className="login-api-error">{error}</div>}
                                {(!error || token) && (
                                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                                        <div className="daftar-field">
                                            <label className="daftar-field__label">Pilih Pertanyaan Baru</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoShieldCheckmarkOutline className="daftar-field__icon" />
                                                <select
                                                    className="daftar-field__input daftar-field__select"
                                                    value={secQuestion}
                                                    onChange={e => setSecQuestion(e.target.value)}
                                                >
                                                    <option value="">— Pilih pertanyaan —</option>
                                                    {QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="daftar-field">
                                            <label className="daftar-field__label">Jawaban Baru</label>
                                            <div className="daftar-field__input-wrap">
                                                <IoShieldCheckmarkOutline className="daftar-field__icon" />
                                                <input
                                                    type="text"
                                                    className="daftar-field__input"
                                                    placeholder="Ketik jawabanmu"
                                                    value={secAnswer}
                                                    onChange={e => setSecAnswer(e.target.value)}
                                                    autoComplete="off"
                                                    maxLength={64}
                                                />
                                            </div>
                                        </div>
                                        <button className="daftar-submit" type="submit" disabled={loading || !token}>
                                            {loading ? 'Menyimpan...' : 'Simpan Pertanyaan Keamanan'}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
            <Footer />
        </>
    );
}
