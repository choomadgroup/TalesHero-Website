import { query } from './db.js';

export default async function stats(req, res) {
  try {
    const [accountRows, onlineRows] = await Promise.all([
      // userinfofrompublisher = akun game sesungguhnya (bukan hanya web registrasi)
      query('SELECT COUNT(*) AS total FROM userinfofrompublisher'),
      query('SELECT COUNT(*) AS total FROM userinfologin WHERE fdServerNum > 0'),
    ]);
    res.status(200).json({
      accounts: Number(accountRows[0].total),
      online:   Number(onlineRows[0].total),
    });
  } catch {
    res.status(500).json({ accounts: null, online: null });
  }
}
