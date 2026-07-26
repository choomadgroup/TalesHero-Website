// ============================================================
//  Tales Hero Indonesia — Email Sender (nodemailer)
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '..', 'public', 'Image', 'tales-hero-banner.png');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_PORT !== '587',   // true = SSL/465, false = TLS/587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // shared-hosting: sertifikat diterbitkan untuk hostname server (mx9.mailspace.id),
    // bukan alias domain (mail.taleshero.web.id) — lewati verifikasi CN
    rejectUnauthorized: false,
  },
});

const FROM   = `"Tales Hero Indonesia" <${process.env.SMTP_USER}>`;
const BASE   = 'https://taleshero.web.id';
const UNSUBSCRIBE = `<mailto:${process.env.SMTP_USER}?subject=unsubscribe>`;

/** Attachment logo yang di-embed langsung ke email (tidak perlu load dari URL) */
function logoAttachment() {
  return {
    filename:    'logo.png',
    path:        LOGO_PATH,
    cid:         'taleshero-logo',
    contentDisposition: 'inline',
  };
}

/** Wrapper HTML email dengan header logo dan footer */
function emailShell(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-width:520px">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;text-align:center">
            <img src="cid:taleshero-logo" alt="Tales Hero Indonesia" style="height:56px;display:block;margin:0 auto" />
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px 32px 24px">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:11px">
              &copy; ${new Date().getFullYear()} Tales Hero Indonesia &bull;
              <a href="${BASE}" style="color:#94a3b8">taleshero.web.id</a>
            </p>
            <p style="margin:4px 0 0;color:#cbd5e1;font-size:10px">
              Email ini dikirim otomatis, mohon tidak membalas langsung.
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
    <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px">Reset Kata Sandi</h2>
    <p style="color:#475569;margin:0 0 8px">Halo <strong>${toUsername}</strong>,</p>
    <p style="color:#475569;margin:0 0 20px">Kami menerima permintaan untuk mereset kata sandi akunmu. Klik tombol di bawah untuk melanjutkan:</p>
    <table cellpadding="0" cellspacing="0"><tr><td>
      <a href="${link}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
        Reset Kata Sandi
      </a>
    </td></tr></table>
    <p style="color:#64748b;font-size:13px;margin:20px 0 8px">Link ini berlaku selama <strong>1 jam</strong>. Jika kamu tidak meminta reset, abaikan email ini.</p>
    <p style="color:#64748b;font-size:13px;margin:0">Atau salin link berikut ke browser:<br>
      <a href="${link}" style="color:#2563eb;word-break:break-all">${link}</a>
    </p>
  `;

  const plainText = `Reset Kata Sandi — Tales Hero Indonesia\n\nHalo ${toUsername},\n\nKlik link berikut untuk mereset kata sandimu:\n${link}\n\nLink berlaku 1 jam. Jika kamu tidak meminta reset, abaikan email ini.\n\n© ${new Date().getFullYear()} Tales Hero Indonesia`;

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: 'Reset Kata Sandi Tales Hero Indonesia',
    text: plainText,
    html: emailShell(bodyHtml),
    headers: { 'List-Unsubscribe': UNSUBSCRIBE },
    attachments: [logoAttachment()],
  });
}

/** Kirim jawaban pertanyaan keamanan yang tersimpan saat pendaftaran */
export async function sendSecurityQuestionEmail(toEmail, toUsername, secQuestion, secAnswer) {
  const displayAnswer = secAnswer && secAnswer.trim()
    ? secAnswer.trim()
    : '(jawaban tidak tersedia — daftar ulang untuk menyimpannya)';

  const bodyHtml = `
    <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px">Pemulihan Akun</h2>
    <p style="color:#475569;margin:0 0 8px">Halo <strong>${toUsername}</strong>,</p>
    <p style="color:#475569;margin:0 0 4px">Pertanyaan keamanan akunmu:</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 16px;font-style:italic">${secQuestion}</p>
    <p style="color:#475569;margin:0 0 8px">Jawaban yang kamu buat saat pendaftaran:</p>
    <div style="padding:14px 18px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;color:#166534;font-weight:700;font-size:16px;letter-spacing:0.3px">
      ${displayAnswer}
    </div>
    <p style="color:#64748b;font-size:12px;margin:16px 0 0">Jika kamu juga lupa kata sandi, gunakan halaman pemulihan akun untuk meminta link reset kata sandi.</p>
  `;

  const plainText = `Pemulihan Akun — Tales Hero Indonesia\n\nHalo ${toUsername},\n\nPertanyaan keamanan akunmu:\n${secQuestion}\n\nJawaban yang kamu buat saat pendaftaran:\n${displayAnswer}\n\nJika kamu juga lupa kata sandi, gunakan halaman pemulihan akun.\n\n© ${new Date().getFullYear()} Tales Hero Indonesia`;

  await transporter.sendMail({
    from:    FROM,
    to:      toEmail,
    subject: 'Pemulihan Akun Tales Hero Indonesia',
    text:    plainText,
    html:    emailShell(bodyHtml),
    headers: { 'List-Unsubscribe': UNSUBSCRIBE },
    attachments: [logoAttachment()],
  });
}
