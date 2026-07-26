// ============================================================
//  Tales Hero Indonesia — Email Sender (Resend)
// ============================================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM  = 'Tales Hero Indonesia <noreply@taleshero.web.id>';
const BASE  = 'https://taleshero.web.id';
const LOGO  = `${BASE}/Image/tales-hero-banner.png`;

/** Wrapper HTML email — layout simpel, logo kiri atas */
function emailShell(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;max-width:520px;overflow:hidden">
        <tr><td style="padding:32px 32px 24px">
          <img src="${LOGO}" alt="Tales Hero" style="height:48px;display:block;margin-bottom:20px" />
          ${bodyHtml}
        </td></tr>
        <tr>
          <td style="padding:16px 32px 20px;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#94a3b8;font-size:11px">
              &copy; ${new Date().getFullYear()} Tales Hero Indonesia. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Kirim email reset kata sandi */
export async function sendPasswordResetEmail(toEmail, toUsername, token) {
  const link = `${BASE}/reset-password?token=${token}`;

  const bodyHtml = `
    <h2 style="color:#1a1a1a;margin:0 0 8px">Reset Kata Sandi</h2>
    <p style="color:#4a5568;margin:0 0 8px">Halo <strong>${toUsername}</strong>,</p>
    <p style="color:#4a5568;margin:0 0 20px">
      Kami menerima permintaan untuk mereset kata sandi akunmu.
      Klik tombol di bawah untuk melanjutkan:
    </p>
    <a href="${link}"
       style="display:inline-block;margin:0 0 20px;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
      Reset Kata Sandi
    </a>
    <p style="color:#718096;font-size:13px;margin:0 0 6px">
      Link ini berlaku selama <strong>1 jam</strong>.
      Jika kamu tidak meminta reset, abaikan email ini.
    </p>
    <p style="color:#718096;font-size:13px;margin:0">
      Atau salin link berikut ke browser:<br>
      <a href="${link}" style="color:#2563eb;word-break:break-all">${link}</a>
    </p>
  `;

  const plainText = [
    'Reset Kata Sandi — Tales Hero Indonesia',
    '',
    `Halo ${toUsername},`,
    '',
    'Klik link berikut untuk mereset kata sandimu:',
    link,
    '',
    'Link berlaku 1 jam. Jika kamu tidak meminta reset, abaikan email ini.',
    '',
    `© ${new Date().getFullYear()} Tales Hero Indonesia`,
  ].join('\n');

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Reset Kata Sandi Tales Hero Indonesia',
    text: plainText,
    html: emailShell(bodyHtml),
  });

  if (error) throw new Error(`[mailer] Resend error: ${error.message}`);
}

/** Kirim jawaban pertanyaan keamanan yang tersimpan saat pendaftaran */
export async function sendSecurityQuestionEmail(toEmail, toUsername, secQuestion, secAnswer) {
  const displayAnswer = secAnswer && secAnswer.trim()
    ? secAnswer.trim()
    : '(jawaban tidak tersedia — daftar ulang untuk menyimpannya)';

  const bodyHtml = `
    <h2 style="color:#1a1a1a;margin:0 0 8px">Pemulihan Akun</h2>
    <p style="color:#4a5568;margin:0 0 8px">Halo <strong>${toUsername}</strong>,</p>
    <p style="color:#4a5568;margin:0 0 4px">Pertanyaan keamanan akunmu:</p>
    <p style="color:#64748b;font-size:13px;font-style:italic;margin:0 0 16px">${secQuestion}</p>
    <p style="color:#4a5568;margin:0 0 8px">Jawaban yang kamu buat saat pendaftaran:</p>
    <div style="padding:14px 18px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;color:#166534;font-weight:700;font-size:15px">
      ${displayAnswer}
    </div>
    <p style="color:#718096;font-size:13px;margin:16px 0 0">
      Jika kamu juga lupa kata sandi, gunakan halaman pemulihan akun untuk meminta link reset kata sandi.
    </p>
  `;

  const plainText = [
    'Pemulihan Akun — Tales Hero Indonesia',
    '',
    `Halo ${toUsername},`,
    '',
    `Pertanyaan keamanan: ${secQuestion}`,
    '',
    `Jawaban yang kamu buat saat pendaftaran: ${displayAnswer}`,
    '',
    'Jika kamu juga lupa kata sandi, gunakan halaman pemulihan akun.',
    '',
    `© ${new Date().getFullYear()} Tales Hero Indonesia`,
  ].join('\n');

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: 'Pemulihan Akun Tales Hero Indonesia',
    text: plainText,
    html: emailShell(bodyHtml),
  });

  if (error) throw new Error(`[mailer] Resend error: ${error.message}`);
}
