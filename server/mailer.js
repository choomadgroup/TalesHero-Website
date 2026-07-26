// ============================================================
//  Tales Hero Indonesia — Email Sender (nodemailer)
// ============================================================

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_PORT !== '587',   // true = SSL/465, false = TLS/587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Tales Hero Indonesia" <${process.env.SMTP_USER}>`;
const BASE = 'https://taleshero.web.id';

/** Kirim email reset kata sandi */
export async function sendPasswordResetEmail(toEmail, toUsername, token) {
  const link = `${BASE}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to:   toEmail,
    subject: 'Reset Kata Sandi — Tales Hero Indonesia',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px">
        <img src="${BASE}/Image/tales-hero-banner.png" alt="Tales Hero" style="width:160px;margin-bottom:20px" />
        <h2 style="color:#1a1a1a;margin:0 0 8px">Reset Kata Sandi</h2>
        <p style="color:#4a5568">Halo <strong>${toUsername}</strong>,</p>
        <p style="color:#4a5568">Kami menerima permintaan untuk mereset kata sandi akunmu. Klik tombol di bawah untuk melanjutkan:</p>
        <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Kata Sandi
        </a>
        <p style="color:#718096;font-size:13px">Link ini berlaku selama <strong>1 jam</strong>. Jika kamu tidak meminta reset, abaikan email ini.</p>
        <p style="color:#718096;font-size:13px">Atau salin link berikut ke browser:<br><a href="${link}" style="color:#2563eb">${link}</a></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#a0aec0;font-size:11px">© ${new Date().getFullYear()} Tales Hero Indonesia. All rights reserved.</p>
      </div>
    `,
  });
}

/** Kirim email reset pertanyaan keamanan */
export async function sendSecurityResetEmail(toEmail, toUsername, token) {
  const link = `${BASE}/reset-security-question?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to:   toEmail,
    subject: 'Reset Pertanyaan Keamanan — Tales Hero Indonesia',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;border:1px solid #e2e8f0;border-radius:12px">
        <img src="${BASE}/Image/tales-hero-banner.png" alt="Tales Hero" style="width:160px;margin-bottom:20px" />
        <h2 style="color:#1a1a1a;margin:0 0 8px">Reset Pertanyaan Keamanan</h2>
        <p style="color:#4a5568">Halo <strong>${toUsername}</strong>,</p>
        <p style="color:#4a5568">Klik tombol di bawah untuk mengatur ulang pertanyaan keamanan akunmu:</p>
        <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Reset Pertanyaan Keamanan
        </a>
        <p style="color:#718096;font-size:13px">Link ini berlaku selama <strong>1 jam</strong>.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#a0aec0;font-size:11px">© ${new Date().getFullYear()} Tales Hero Indonesia. All rights reserved.</p>
      </div>
    `,
  });
}
