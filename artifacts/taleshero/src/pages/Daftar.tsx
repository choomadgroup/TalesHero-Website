import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export default function Daftar() {
    const [, setLocation] = useLocation();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ nama: '', email: '', password: '' });
    const [showPw, setShowPw] = useState(false);

    useEffect(() => {
        document.title = 'Daftar Hero — Tales Hero Indonesia';
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.message || 'Terjadi kesalahan, coba lagi.');
            }
        } catch {
            setError('Gagal terhubung ke server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="daftar-bg">
            <div className="daftar-container">

                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <a href="/" onClick={e => { e.preventDefault(); setLocation('/'); }}>
                        <img
                            src="/Image/tales-hero-banner.png"
                            alt="Tales Hero Indonesia"
                            style={{ width: 200, cursor: 'pointer' }}
                        />
                    </a>
                </div>

                <div className="daftar-card">
                    <h2 style={{ textAlign: 'center', marginBottom: 4 }}>Buat Akun Hero</h2>
                    <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginBottom: 20 }}>
                        Bergabunglah dalam petualangan legenda bersama jutaan hero Indonesia!
                    </p>

                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🎉</p>
                            <p style={{ fontSize: '1.1rem', color: 'green', fontWeight: 600, margin: '0 0 8px' }}>
                                Akun berhasil dibuat!
                            </p>
                            <p style={{ color: '#888', marginBottom: 20 }}>
                                Selamat datang di Tales Hero Indonesia. Petualanganmu dimulai sekarang!
                            </p>
                            <button className="btn-yellow btn-full" onClick={() => setLocation('/')}>
                                Kembali ke Beranda
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="alert-error">{error}</div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Nama Hero <span className="required">*</span></label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Masukkan nama heromu"
                                    required
                                    value={form.nama}
                                    onChange={e => setForm({ ...form, nama: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email <span className="required">*</span></label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="email@example.com"
                                    required
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: 24 }}>
                                <label className="form-label">Password <span className="required">*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="form-input"
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Minimal 8 karakter"
                                        required
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        className="pw-toggle"
                                        onClick={() => setShowPw(s => !s)}
                                    >
                                        {showPw ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-yellow btn-full" disabled={loading}>
                                {loading ? 'Memproses...' : '⚔️ Mulai Petualangan!'}
                            </button>
                        </form>
                    )}

                    <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#888' }}>
                        Sudah punya akun?{' '}
                        <a
                            href="/"
                            style={{ color: '#fab005', fontWeight: 500, textDecoration: 'none' }}
                            onClick={e => { e.preventDefault(); setLocation('/'); }}
                        >
                            Kembali ke Beranda
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
