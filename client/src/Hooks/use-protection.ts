import { useEffect } from 'react';

const ALLOWED_HOST = 'taleshero.web.id';

/** Tampilkan layar blokir penuh dan hentikan semua eksekusi. */
function blockSite() {
    document.documentElement.innerHTML = `
        <style>
            *{margin:0;padding:0;box-sizing:border-box}
            body{
                min-height:100vh;display:flex;align-items:center;
                justify-content:center;flex-direction:column;gap:16px;
                background:#0a0a0a;color:#fff;font-family:sans-serif;
                text-align:center;padding:24px;
            }
            h1{font-size:2rem;color:#e53e3e}
            p{color:#a0aec0;max-width:480px;line-height:1.6}
            a{color:#63b3ed}
        </style>
        <h1>⛔ Akses Ditolak</h1>
        <p>Website ini hanya dapat diakses melalui domain resmi:<br>
           <a href="https://${ALLOWED_HOST}" rel="noopener noreferrer">
               https://${ALLOWED_HOST}
           </a>
        </p>
        <p style="font-size:12px">
            © ${new Date().getFullYear()} Tales Hero Indonesia. All rights reserved.
        </p>
    `;
    throw new Error('[TalesHero] Unauthorized domain.');
}

/**
 * Proteksi konten Tales Hero Indonesia.
 * Proteksi browser aktif di production. Proteksi sumber utama dilakukan server-side
 * supaya tidak bergantung pada JavaScript client yang bisa dimatikan.
 */
export function useProtection() {
    useEffect(() => {
        if (import.meta.env.DEV) return;

        // ── 0. Domain lock ────────────────────────────────────
        if (window.location.hostname !== ALLOWED_HOST) {
            blockSite();
            return;
        }

        // ── 1. Peringatan copyright di console ───────────────
        console.clear();
        console.log(
            '%c⛔ STOP!',
            'color:#e53e3e;font-size:48px;font-weight:900;'
        );
        console.log(
            '%cSeluruh source code, desain, aset gambar, dan konten website ini\n' +
            'adalah hak milik Tales Hero Indonesia.\n\n' +
            'Dilarang keras menyalin, mendistribusikan, atau menggunakan ulang\n' +
            'Halaman ini di desain oleh Choiril Ahmad.\n' +
            'tanpa izin tertulis dari pemilik.\n\n' +
            '© ' + new Date().getFullYear() + ' Tales Hero Indonesia. All rights reserved.',
            'color:#1a1a1a;font-size:14px;line-height:1.7;'
        );

        // ── 2. Blokir klik kanan ─────────────────────────────
        const blockContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', blockContextMenu);
        const blockCopy = (e: ClipboardEvent) => e.preventDefault();
        const blockSelection = (e: Event) => e.preventDefault();
        document.addEventListener('copy', blockCopy);
        document.addEventListener('cut', blockCopy);
        document.addEventListener('selectstart', blockSelection);

        // ── 3. Blokir shortcut DevTools & View Source ────────
        const blockKeys = (e: KeyboardEvent) => {
            const ctrl  = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const key   = e.key;

            // F12
            if (key === 'F12') { e.preventDefault(); return; }
            // Ctrl+U  — View Source
            if (ctrl && key === 'u') { e.preventDefault(); return; }
            // Ctrl+S  — Save Page
            if (ctrl && key === 's') { e.preventDefault(); return; }
            // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C — DevTools
            if (ctrl && shift && (key === 'I' || key === 'i' ||
                                  key === 'J' || key === 'j' ||
                                  key === 'C' || key === 'c')) {
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', blockKeys);

        // ── 4. Blokir drag gambar ─────────────────────────────
        const blockDrag = (e: DragEvent) => e.preventDefault();
        document.addEventListener('dragstart', blockDrag);

        return () => {
            document.removeEventListener('contextmenu', blockContextMenu);
            document.removeEventListener('copy', blockCopy);
            document.removeEventListener('cut', blockCopy);
            document.removeEventListener('selectstart', blockSelection);
            document.removeEventListener('keydown', blockKeys);
            document.removeEventListener('dragstart', blockDrag);
        };
    }, []);
}
