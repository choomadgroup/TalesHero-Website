// ============================================================
//  Tales Hero Indonesia — Email Sender (Resend)
// ============================================================

import fs   from 'fs';
import path from 'path';
import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('[Mailer] RESEND_API_KEY is not configured.');
  return new Resend(apiKey);
}

const FROM_ADDRESS = 'noreply@taleshero.web.id';
const REPLY_TO     = 'support@taleshero.web.id';
const FROM         = `"Tales Hero Indonesia" <${FROM_ADDRESS}>`;
const BASE         = 'https://taleshero.web.id';
const APP_BASE_URL = (process.env.APP_BASE_URL?.trim() || BASE).replace(/\/+$/, '');

// Logo di-embed langsung via CID — tampil di Gmail tanpa perlu klik "Tampilkan gambar"
const LOGO_CID  = 'logo@taleshero.web.id';
const LOGO_PATH = path.resolve('public/Image/tales-hero-banner.png');

const SOCIAL = {
  facebook  : 'https://facebook.com/talesheronostalgia',
  instagram : 'https://instagram.com/taleshero.in.id',
  support   : REPLY_TO,
};

// Icon sosmed dihosting di domain sendiri (40×40 SVG)
const ICON = {
  facebook  : `${BASE}/Image/Email/facebook.svg`,
  instagram : `${BASE}/Image/Email/instagram.svg`,
  support   : `${BASE}/Image/Email/support.svg`,
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Preheader — teks tersembunyi yang muncul sebagai preview di inbox */
function preheader(text) {
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;
max-width:0;opacity:0;overflow:hidden;mso-hide:all">${text}&nbsp;&zwnj;&zwnj;&zwnj;&zwnj;</div>`;
}

/**
 * Baca logo sebagai Buffer untuk di-embed via CID.
 * Fallback ke empty buffer jika file tidak ditemukan.
 */
function readLogo() {
  try { return fs.readFileSync(LOGO_PATH); }
  catch { return null; }
}

/**
 * Attachment list — logo selalu disertakan sebagai inline.
 */
function logoAttachment() {
  const buf = readLogo();
  if (!buf) return [];
  return [{
    filename    : 'tales-hero-logo.png',
    content     : buf,
    contentType : 'image/png',
    contentId   : LOGO_CID,
  }];
}

// ── Shell HTML ─────────────────────────────────────────────────────────────

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
          <td style="padding:28px 36px 20px;text-align:center;border-bottom:1px solid #eef0f3">
            <img src="cid:${LOGO_CID}"
                 alt="Tales Hero Indonesia"
                 width="200" height="auto"
                 style="display:block;height:auto;max-height:68px;object-fit:contain;border:0;outline:none;margin:0 auto"/>
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

// ── Password Reset ─────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(toEmail, toUsername, token) {
  const resend = getResendClient();
  const link   = `${BASE}/reset-password?token=${token}`;

  const bodyHtml = `
    <!-- Judul & subjudul -->
    <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif;
              letter-spacing:-0.3px">Reset Kata Sandi</p>
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;line-height:1.6;
              border-bottom:1px solid #f1f5f9;padding-bottom:20px">
      Permintaan reset kata sandi untuk akun <strong style="color:#374151">${toUsername}</strong>
      di Tales Hero Indonesia
    </p>

    <!-- Sapaan -->
    <p style="margin:0 0 16px;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7">
      Halo <strong>${toUsername}</strong>,<br>
      kami menerima permintaan untuk mereset kata sandi akunmu.
      Klik tombol di bawah untuk melanjutkan — link hanya berlaku selama <strong>1 jam</strong>.
    </p>

    <!-- CTA button — tengah, full-width -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:24px 0">
      <tr>
        <td align="center">
          <a href="${link}" target="_blank" rel="noopener"
             style="display:inline-block;padding:15px 48px;
                    background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%);
                    color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;
                    font-family:Arial,Helvetica,sans-serif;border-radius:10px;
                    letter-spacing:.4px;box-shadow:0 4px 12px rgba(37,99,235,0.35)">
            Reset Kata Sandi
          </a>
        </td>
      </tr>
    </table>

    <!-- Link cadangan -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                padding:14px 18px;margin:0 0 20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#94a3b8;
                text-transform:uppercase;letter-spacing:.5px;font-family:Arial,Helvetica,sans-serif">
        Atau salin link ini ke browser
      </p>
      <a href="${link}"
         style="font-size:12px;color:#2563eb;word-break:break-all;
                font-family:Arial,Helvetica,sans-serif;line-height:1.6">${link}</a>
    </div>

    <!-- Peringatan -->
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px">
      <p style="margin:0;font-size:13px;color:#92400e;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        ⚠️ Jika kamu tidak meminta reset ini, abaikan email ini.
        Akunmu tetap aman dan tidak ada perubahan yang akan terjadi.
      </p>
    </div>`;

  const plainText = [
    'Reset Kata Sandi — Tales Hero Indonesia',
    '',
    `Halo ${toUsername},`,
    '',
    'Kami menerima permintaan untuk mereset kata sandi akunmu.',
    'Klik link berikut untuk melanjutkan (berlaku 1 jam):',
    link,
    '',
    'Jika kamu tidak memintanya, abaikan email ini. Akunmu tetap aman.',
    '',
    `Butuh bantuan? Hubungi ${SOCIAL.support}`,
    `© ${new Date().getFullYear()} Tales Hero Indonesia`,
  ].join('\n');

  const { error } = await resend.emails.send({
    from        : FROM,
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

  if (error) throw new Error(`[mailer] Resend error: ${error.message}`);
}

// ── Security Question ──────────────────────────────────────────────────────

export async function sendSecurityQuestionEmail(toEmail, toUsername, secQuestion, secAnswer) {
  const resend = getResendClient();
  const displayAnswer = secAnswer?.trim()
    ? secAnswer.trim()
    : '(jawaban tidak tersedia — daftar ulang untuk menyimpannya)';

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif;
              letter-spacing:-0.3px">Pemulihan Akun</p>
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;line-height:1.6;
              border-bottom:1px solid #f1f5f9;padding-bottom:20px">
      Informasi pertanyaan keamanan akun <strong style="color:#374151">${toUsername}</strong>
      di Tales Hero Indonesia
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7">
      Halo <strong>${toUsername}</strong>,<br>
      berikut adalah pertanyaan dan jawaban keamanan yang kamu buat saat mendaftar.
    </p>

    <!-- Pertanyaan -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:0 0 12px">
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

  const { error } = await resend.emails.send({
    from        : FROM,
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

  if (error) throw new Error(`[mailer] Resend error: ${error.message}`);
}

// ── Registration Verification ──────────────────────────────────────────────
export async function sendRegistrationVerificationEmail(toEmail, toUsername, token) {
  const resend = getResendClient();
  const link = `${APP_BASE_URL}/verifikasi?token=${encodeURIComponent(token)}`;

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#111827;font-family:Arial,Helvetica,sans-serif">
      Verifikasi Akun
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;line-height:1.6;border-bottom:1px solid #f1f5f9;padding-bottom:20px">
      Satu langkah lagi untuk mengaktifkan akun <strong style="color:#374151">${toUsername}</strong>
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.7">
      Halo <strong>${toUsername}</strong>,<br>
      klik tombol di bawah untuk memverifikasi email dan membuat akun game Tales Hero Indonesia.
      Link ini berlaku selama <strong>30 menit</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin:24px 0">
      <tr><td align="center">
        <a href="${link}" target="_blank" rel="noopener"
           style="display:inline-block;padding:15px 48px;background:linear-gradient(135deg,#db2777 0%,#ec4899 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,Helvetica,sans-serif;border-radius:10px;letter-spacing:.4px">
          Verifikasi Email
        </a>
      </td></tr>
    </table>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin:0 0 20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;font-family:Arial,Helvetica,sans-serif">
        Atau salin link ini ke browser
      </p>
      <a href="${link}" style="font-size:12px;color:#db2777;word-break:break-all;font-family:Arial,Helvetica,sans-serif;line-height:1.6">${link}</a>
    </div>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:14px 18px">
      <p style="margin:0;font-size:13px;color:#92400e;font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        Jika kamu tidak membuat akun ini, abaikan email ini. Tidak ada akun game yang dibuat sebelum email diverifikasi.
      </p>
    </div>`;

  const plainText = [
    'Verifikasi Akun — Tales Hero Indonesia',
    '',
    `Halo ${toUsername},`,
    '',
    'Klik link berikut untuk memverifikasi email dan membuat akun game.',
    'Link berlaku selama 30 menit:',
    link,
    '',
    'Jika kamu tidak membuat akun ini, abaikan email ini.',
    `Butuh bantuan? Hubungi ${SOCIAL.support}`,
    `© ${new Date().getFullYear()} Tales Hero Indonesia`,
  ].join('\n');

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    replyTo: REPLY_TO,
    subject: 'Verifikasi Akun — Tales Hero Indonesia',
    text: plainText,
    html: emailShell(
      'linear-gradient(90deg,#db2777,#ec4899)',
      bodyHtml,
      `Verifikasi email Tales Hero Indonesia untuk ${toUsername}. Berlaku 30 menit.`,
    ),
    attachments: logoAttachment(),
    headers: {
      'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>`,
      'X-Mailer': 'Tales Hero Indonesia Mailer',
      'X-Entity-Ref-ID': `verify-${toEmail}-${Date.now()}`,
    },
  });

  if (error) throw new Error(`[mailer] Resend error: ${error.message}`);
}
