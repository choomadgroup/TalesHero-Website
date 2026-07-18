import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  success: boolean;
  message: string;
};

// API Route: POST /api/contact
// Menerima data pendaftaran hero baru dari halaman /daftar
export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method tidak diizinkan' });
  }

  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  }

  // Di production: simpan ke database, kirim email verifikasi, dll.
  console.log(`[Tales Hero] Pendaftaran baru: ${nama} (${email}) — ${new Date().toISOString()}`);

  return res.status(200).json({ success: true, message: 'Akun berhasil dibuat!' });
}
