// ============================================================
//  Tales Hero Indonesia — Email Sender (Nodemailer SMTP)
// ============================================================
//
//  Required env vars:
//    EMAIL_USER   — alamat Gmail/SMTP pengirim (mis. noreply@gmail.com)
//    EMAIL_PASS   — Gmail App Password atau SMTP password
//
//  Optional env vars:
//    SMTP_HOST    — default: smtp.gmail.com
//    SMTP_PORT    — default: 465
//    EMAIL_FROM   — nama pengirim, default: "Tales Hero Indonesia"

import nodemailer from 'nodemailer';
import fs         from 'fs';
import path       from 'path';

// ── Config ─────────────────────────────────────────────────────────────────

const FROM_NAME    = process.env.EMAIL_FROM  || 'Tales Hero Indonesia';
const REPLY_TO     = 'support@taleshero.web.id';
const BASE         = 'https://taleshero.web.id';

const SOCIAL = {
  facebook  : 'https://facebook.com/talesheronostalgia',
  instagram : 'https://instagram.com/taleshero.in.id',
  support   : REPLY_TO,
};

const ICON = {
  facebook  : `${BASE}/Image/email/facebook.svg`,
  instagram : `${BASE}/Image/email/instagram.svg`,
  support   : `${BASE}/Image/email/support.svg`,
};

// Logo di-embed via CID agar tampil tanpa klik "tampilkan gambar"
const LOGO_CID  = 'logo@taleshero';
const LOGO_PATH = path.resolve('public/Image/tales-hero-banner.png');

// ── Transport ───────────────────────────────────────────────────────────────

function getTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();
  if (!user || !pass) throw new Error('[Mailer] EMAIL_USER dan EMAIL_PASS wajib dikonfigurasi.');

  return nodemailer.createTransport({
    host   : process.env.SMTP_HOST || 'smtp.gmail.com',
    port   : parseInt(process.env.SMTP_PORT || '465', 10),
    secure : true,              // SSL (port 465) — lebih baik dari STARTTLS untuk deliverability
    auth   : { user, pass },
    pool   : true,              // reuse connections
    maxConnections: 3,
  });
}

function getSenderAddress() {
  const user = process.env.EMAIL_USER?.trim();
  if (!user) throw new Error('[Mailer] EMAIL_USER wajib dikonfigurasi.');
  return `"${FROM_NAME}" <${user}>`;
}

// ── Logo attachment ─────────────────────────────────────────────────────────

function logoAttachment() {
  try {
    fs.accessSync(LOGO_PATH);
    return [{
      filename    : 'tales-hero-logo.png',
      path        : LOGO_PATH,
      cid         : LOGO_CID,
      contentType : 'image/png',
    }];
  } catch {
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Preheader — teks tersembunyi sebagai preview di inbox */
function preheader(text) {
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;
max-width:0;opacity:0;overflow:hidden;mso-hide:all">${text}&nbsp;&zwnj;&zwnj;&zwnj;&zwnj;</div>`;
}

// ── Shell HTML ──────────────────────────────────────────────────────────────

function emailShell(accentGradient, bodyHtml, previewText = '') {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Tales Hero Indonesia</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  ${previewText ? preheader(previewText) : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f0f2f5;padding:36px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;
                    overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.08)">

        <!-- Accent bar atas -->
        <tr><td style="background:${accentGradient};height:5px;padding:0;font-size:0;line-height:0">&nbsp;</td></tr>

        <!-- Logo header -->
        <tr>
          <td style="padding:28px 36px 20px;text-align:left;border-bottom:1px solid #eef0f3">
            <img src="cid:${LOGO_CID}"
                 alt="Tales Hero Indonesia"
                 width="160" height="auto"
                 style="display:block;height:auto;max-height:52px;object-fit:contain;border:0;outline:none"/>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 36px 32px">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer: sosmed -->
        <tr>
          <td style="padding:20px 36px 12px;border-top:1px solid #eef0f3;text-align:center">
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto">
              <tr>
                <td style="padding:0 8px">
                  <a href="${SOCIAL.facebook}" target="_blank" rel="noopener"
                     style="text-decoration:none;display:block">
                    <img src="${ICON.facebook}" width="36" height="36" alt="Facebook"
                         style="display:block;border:0;outline:none;border-radius:8px"/>
                  </a>
                </td>
                <td style="padding:0 8px">
                  <a href="${SOCIAL.instagram}" target="_blank" rel="noopener"
                     style="text-decoration:none;display:block">
                    <img src="${ICON.instagram}" width="36" height="36" alt="Instagram"
                         style="display:block;border:0;outline:none;border-radius:8px"/>
                  </a>
                </td>
                <td style="padding:0 8px">
                  <a href="mailto:${SOCIAL.support}"
                     style="text-decoration:none;display:block">
                    <img src="${ICON.support}" width="36" height="36" alt="Email Support"
                         style="display:block;border:0;outline:none;border-radius:8px"/>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer: copyright -->
        <tr>
          <td style="padding:0 36px 20px;text-align:center">
            <p style="margin:10px 0 4px;font-size:12px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif">
              &copy; ${year} Tales Hero Indonesia. All rights reserved.
            </p>
            <p style="margin:0;font-size:11px;color:#b0bec5;font-family:Arial,Helvetica,sans-serif">
              Butuh bantuan?
              <a href="mailto:${SOCIAL.support}"
                 style="color:#b0bec5;text-decoration:underline">${SOCIAL.support}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Password Reset ──────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(toEmail, toUsername, token) {
  const transporter = getTransporter();
  const link        = `${BASE}/reset-password?token=${token}`;

  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif">Reset Kata Sandi</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
      Permintaan untuk mereset kata sandi akun Tales Hero Indonesia kamu
    </p>

    <p style="margin:0 0 6px;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif">
      Halo <strong>${toUsername}</strong>,
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7">
      Kami menerima permintaan untuk mereset kata sandi akunmu.
      Klik tombol di bawah untuk melanjutkan. Link berlaku selama <strong>1 jam</strong>.
    </p>

    <!-- CTA button -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px">
      <tr>
        <td style="border-radius:8px;background:linear-gradient(135deg,#1d4ed8,#2563eb)">
          <a href="${link}" target="_blank" rel="noopener"
             style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;
                    font-weight:700;font-size:15px;font-family:Arial,Helvetica,sans-serif;
                    border-radius:8px;letter-spacing:.3px">
            Reset Kata Sandi &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;font-family:Arial,Helvetica,sans-serif">
      Atau salin link berikut ke browser:
    </p>
    <p style="margin:0 0 20px;font-size:12px;font-family:Arial,Helvetica,sans-serif">
      <a href="${link}" style="color:#2563eb;word-break:break-all">${link}</a>
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px">
      <p style="margin:0;font-size:13px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        Jika kamu tidak meminta reset kata sandi, abaikan email ini — akunmu tetap aman.
      </p>
    </div>`;

  const plainText = [
    'Reset Kata Sandi — Tales Hero Indonesia',
    '',
    `Halo ${toUsername},`,
    '',
    'Klik link berikut untuk mereset kata sandimu:',
    link,
    '',
    'Link berlaku 1 jam. Jika kamu tidak memintanya, abaikan email ini.',
    '',
    `Butuh bantuan? Hubungi ${SOCIAL.support}`,
    `© ${new Date().getFullYear()} Tales Hero Indonesia`,
  ].join('\n');

  await transporter.sendMail({
    from        : getSenderAddress(),
    to          : toEmail,
    replyTo     : REPLY_TO,
    subject     : 'Reset Kata Sandi — Tales Hero Indonesia',
    text        : plainText,
    html        : emailShell(
      'linear-gradient(90deg,#1d4ed8,#3b82f6)',
      bodyHtml,
      `Link reset kata sandi Tales Hero Indonesia untuk ${toUsername}. Berlaku 1 jam.`,
    ),
    attachments : logoAttachment(),
    headers     : {
      'List-Unsubscribe' : `<mailto:${REPLY_TO}?subject=unsubscribe>`,
      'X-Mailer'         : 'Tales Hero Indonesia Mailer',
      'X-Entity-Ref-ID'  : `reset-${toEmail}-${Date.now()}`,
    },
  });
}

// ── Security Question ───────────────────────────────────────────────────────

export async function sendSecurityQuestionEmail(toEmail, toUsername, secQuestion, secAnswer) {
  const transporter  = getTransporter();
  const displayAnswer = secAnswer?.trim()
    ? secAnswer.trim()
    : '(jawaban tidak tersedia — daftar ulang untuk menyimpannya)';

  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif">Pemulihan Akun</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
      Informasi pertanyaan keamanan akun Tales Hero Indonesia kamu
    </p>

    <p style="margin:0 0 6px;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif">
      Halo <strong>${toUsername}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7">
      Berikut adalah pertanyaan dan jawaban keamanan yang kamu buat saat mendaftar.
    </p>

    <!-- Pertanyaan -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:0 0 16px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;
                text-transform:uppercase;letter-spacing:.6px;font-family:Arial,Helvetica,sans-serif">
        Pertanyaan Keamanan
      </p>
      <p style="margin:0;font-size:14px;color:#374151;font-style:italic;font-family:Arial,Helvetica,sans-serif">
        ${secQuestion}
      </p>
    </div>

    <!-- Jawaban -->
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px 20px;margin:0 0 24px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#16a34a;
                text-transform:uppercase;letter-spacing:.6px;font-family:Arial,Helvetica,sans-serif">
        Jawaban Kamu
      </p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#166534;font-family:Arial,Helvetica,sans-serif;
                word-break:break-word">
        ${displayAnswer}
      </p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px">
      <p style="margin:0;font-size:13px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        Jika kamu juga lupa kata sandi, gunakan halaman pemulihan akun untuk meminta link reset.<br>
        Tidak merasa meminta email ini? Segera hubungi kami di
        <a href="mailto:${SOCIAL.support}" style="color:#94a3b8">${SOCIAL.support}</a>.
      </p>
    </div>`;

  const plainText = [
    'Pemulihan Akun — Tales Hero Indonesia',
    '',
    `Halo ${toUsername},`,
    '',
    `Pertanyaan keamanan: ${secQuestion}`,
    `Jawaban: ${displayAnswer}`,
    '',
    'Jika kamu juga lupa kata sandi, gunakan halaman pemulihan akun.',
    `Bantuan: ${SOCIAL.support}`,
    '',
    `© ${new Date().getFullYear()} Tales Hero Indonesia`,
  ].join('\n');

  await transporter.sendMail({
    from        : getSenderAddress(),
    to          : toEmail,
    replyTo     : REPLY_TO,
    subject     : 'Pemulihan Akun — Tales Hero Indonesia',
    text        : plainText,
    html        : emailShell(
      'linear-gradient(90deg,#0d9488,#14b8a6)',
      bodyHtml,
      `Informasi pemulihan akun Tales Hero Indonesia untuk ${toUsername}.`,
    ),
    attachments : logoAttachment(),
    headers     : {
      'List-Unsubscribe' : `<mailto:${REPLY_TO}?subject=unsubscribe>`,
      'X-Mailer'         : 'Tales Hero Indonesia Mailer',
      'X-Entity-Ref-ID'  : `recovery-${toEmail}-${Date.now()}`,
    },
  });
}
