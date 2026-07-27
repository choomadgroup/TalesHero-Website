// ============================================================
//  Tales Hero Indonesia — Email Sender (Resend)
// ============================================================

import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('[Mailer] RESEND_API_KEY is not configured.');
  return new Resend(apiKey);
}

const FROM_NAME    = 'Tales Hero Indonesia';
const FROM_ADDRESS = 'noreply@taleshero.web.id';
const FROM         = `"${FROM_NAME}" <${FROM_ADDRESS}>`;
const REPLY_TO     = 'support@taleshero.web.id';
const BASE         = 'https://taleshero.web.id';
const LOGO         = `${BASE}/Image/tales-hero-banner.png`;

const SOCIAL = {
  facebook  : 'https://facebook.com/talesheronostalgia',
  instagram : 'https://instagram.com/taleshero.in.id',
  support   : 'support@taleshero.web.id',
};

// ── Shared styles ──────────────────────────────────────────────────────────
const COLORS = {
  bg      : '#f0f2f5',
  card    : '#ffffff',
  border  : '#dde3ec',
  primary : '#1d4ed8',
  text    : '#1e293b',
  muted   : '#64748b',
  faint   : '#94a3b8',
};

/**
 * Preheader — invisible preview text shown after the subject line in inbox.
 * Helps deliverability and reduces "looks spammy" signals.
 */
function preheader(text) {
  return `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;
    opacity:0;overflow:hidden;mso-hide:all">${text}&nbsp;&zwnj;&zwnj;&zwnj;&zwnj;&zwnj;</div>`;
}

/** Footer row with FB, IG, and email support links */
function socialFooter() {
  const year = new Date().getFullYear();

  const btn = (href, bg, label) =>
    `<a href="${href}" target="_blank" rel="noopener"
       style="display:inline-block;margin:0 4px;padding:7px 14px;border-radius:20px;
              background:${bg};color:#ffffff;text-decoration:none;font-size:12px;
              font-weight:600;font-family:Arial,Helvetica,sans-serif">
       ${label}
     </a>`;

  return `
  <tr>
    <td style="padding:20px 32px 12px;border-top:1px solid ${COLORS.border};text-align:center">
      ${btn(SOCIAL.facebook,  '#1877f2', '&#x1F426; Facebook')}
      ${btn(SOCIAL.instagram, '#e1306c', '&#x1F4F7; Instagram')}
      ${btn(`mailto:${SOCIAL.support}`, '#0f766e', '&#x2709; Support')}
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 20px;text-align:center">
      <p style="margin:8px 0 0;color:${COLORS.faint};font-size:11px;font-family:Arial,Helvetica,sans-serif">
        &copy; ${year} Tales Hero Indonesia. All rights reserved.<br>
        Butuh bantuan? Hubungi kami di
        <a href="mailto:${SOCIAL.support}" style="color:${COLORS.faint}">${SOCIAL.support}</a>
      </p>
    </td>
  </tr>`;
}

/**
 * Full HTML email shell.
 * @param {string} bodyHtml   – inner content HTML
 * @param {string} previewText – short preview text (shown in inbox after subject)
 */
function emailShell(bodyHtml, previewText = '') {
  return `<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${FROM_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};
             font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  ${previewText ? preheader(previewText) : ''}
  <!--[if mso]>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
  <![endif]-->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:${COLORS.bg};padding:32px 0">
    <tr><td align="center">
      <!--[if mso]>
      <table width="560" cellpadding="0" cellspacing="0"><tr><td>
      <![endif]-->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:560px;width:100%;background:${COLORS.card};
                    border-radius:12px;border:1px solid ${COLORS.border}">

        <!-- LOGO HEADER -->
        <tr>
          <td style="padding:28px 32px 20px;border-radius:12px 12px 0 0;background:${COLORS.card}">
            <a href="${BASE}" target="_blank" rel="noopener"
               style="display:block;text-decoration:none">
              <img src="${LOGO}"
                   alt="Tales Hero Indonesia"
                   width="160" height="auto"
                   style="display:block;height:auto;max-height:52px;object-fit:contain;border:0;outline:none"
                   onerror="this.style.display='none'" />
              <!--[if !mso]><!-->
              <span style="display:block;margin-top:4px;font-size:13px;
                           font-weight:700;color:${COLORS.primary};letter-spacing:.5px;
                           mso-hide:all">Tales Hero Indonesia</span>
              <!--<![endif]-->
            </a>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:0 32px 28px">
            ${bodyHtml}
          </td>
        </tr>

        <!-- SOCIAL FOOTER -->
        ${socialFooter()}

      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`;
}

// ── Password Reset ─────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(toEmail, toUsername, token) {
  const resend = getResendClient();
  const link   = `${BASE}/reset-password?token=${token}`;

  const bodyHtml = `
    <h2 style="color:${COLORS.text};margin:0 0 8px;font-size:20px">Reset Kata Sandi</h2>
    <p style="color:${COLORS.muted};margin:0 0 6px">Halo <strong style="color:${COLORS.text}">${toUsername}</strong>,</p>
    <p style="color:${COLORS.muted};margin:0 0 24px;line-height:1.6">
      Kami menerima permintaan untuk mereset kata sandi akun Tales Hero Indonesia-mu.
      Klik tombol di bawah untuk melanjutkan. Link ini <strong>berlaku selama 1 jam</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px">
      <tr>
        <td style="border-radius:8px;background:${COLORS.primary}">
          <a href="${link}" target="_blank" rel="noopener"
             style="display:inline-block;padding:13px 32px;color:#ffffff;
                    text-decoration:none;font-weight:700;font-size:15px;
                    border-radius:8px;font-family:Arial,Helvetica,sans-serif">
            Reset Kata Sandi &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="color:${COLORS.muted};font-size:13px;margin:0 0 6px;line-height:1.5">
      Atau salin link berikut ke browser kamu:<br>
      <a href="${link}" style="color:${COLORS.primary};word-break:break-all;font-size:12px">${link}</a>
    </p>
    <hr style="border:none;border-top:1px solid ${COLORS.border};margin:20px 0">
    <p style="color:${COLORS.faint};font-size:12px;margin:0;line-height:1.5">
      Jika kamu tidak meminta reset kata sandi, abaikan email ini — akunmu tetap aman.
    </p>`;

  const plainText = [
    'Reset Kata Sandi — Tales Hero Indonesia',
    '',
    `Halo ${toUsername},`,
    '',
    'Klik link berikut untuk mereset kata sandimu:',
    link,
    '',
    'Link berlaku 1 jam.',
    'Jika kamu tidak meminta reset, abaikan email ini.',
    '',
    `Butuh bantuan? Hubungi ${SOCIAL.support}`,
    `© ${new Date().getFullYear()} Tales Hero Indonesia`,
  ].join('\n');

  const { error } = await resend.emails.send({
    from    : FROM,
    to      : toEmail,
    replyTo : REPLY_TO,
    subject : 'Reset Kata Sandi — Tales Hero Indonesia',
    text    : plainText,
    html    : emailShell(bodyHtml, `Klik untuk reset kata sandi akunmu di Tales Hero Indonesia. Link berlaku 1 jam.`),
    headers : {
      'List-Unsubscribe' : `<mailto:${REPLY_TO}?subject=unsubscribe>`,
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
    <h2 style="color:${COLORS.text};margin:0 0 8px;font-size:20px">Pemulihan Akun</h2>
    <p style="color:${COLORS.muted};margin:0 0 6px">Halo <strong style="color:${COLORS.text}">${toUsername}</strong>,</p>
    <p style="color:${COLORS.muted};margin:0 0 16px;line-height:1.6">
      Berikut adalah pertanyaan dan jawaban keamanan yang kamu buat saat mendaftar di Tales Hero Indonesia.
    </p>
    <div style="padding:16px 18px;background:#f8fafc;border:1px solid ${COLORS.border};
                border-radius:10px;margin:0 0 16px">
      <p style="margin:0 0 6px;color:${COLORS.muted};font-size:13px;font-style:italic">
        ${secQuestion}
      </p>
      <p style="margin:0;color:#166534;font-weight:700;font-size:15px;
                background:#f0fdf4;padding:10px 14px;border-radius:8px;
                border:1px solid #86efac;word-break:break-word">
        ${displayAnswer}
      </p>
    </div>
    <hr style="border:none;border-top:1px solid ${COLORS.border};margin:20px 0">
    <p style="color:${COLORS.faint};font-size:12px;margin:0;line-height:1.5">
      Jika kamu juga lupa kata sandi, kunjungi halaman pemulihan akun untuk meminta link reset.<br>
      Jika kamu tidak meminta pemulihan ini, segera hubungi kami di
      <a href="mailto:${SOCIAL.support}" style="color:${COLORS.faint}">${SOCIAL.support}</a>.
    </p>`;

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
    from    : FROM,
    to      : toEmail,
    replyTo : REPLY_TO,
    subject : 'Pemulihan Akun — Tales Hero Indonesia',
    text    : plainText,
    html    : emailShell(bodyHtml, `Informasi pemulihan akun Tales Hero Indonesia untuk ${toUsername}.`),
    headers : {
      'List-Unsubscribe' : `<mailto:${REPLY_TO}?subject=unsubscribe>`,
      'X-Entity-Ref-ID'  : `recovery-${toEmail}-${Date.now()}`,
    },
  });

  if (error) throw new Error(`[mailer] Resend error: ${error.message}`);
}
