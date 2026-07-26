import { destroySession } from './session.js';

async function logout(req, res) {
  try {
    await destroySession(req, res);
    return res.status(204).end();
  } catch (err) {
    console.error('[logout] error:', err);
    return res.status(500).json({ message: 'Gagal keluar dari akun.' });
  }
}

export default logout;