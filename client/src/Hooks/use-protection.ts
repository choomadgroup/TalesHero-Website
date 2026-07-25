import { useEffect } from 'react';

/**
 * Proteksi konten Tales Hero Indonesia.
 * Hanya aktif di production — tidak mengganggu saat development.
 */
export function useProtection() {
    useEffect(() => {
        if (import.meta.env.DEV) return;

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

            'tanpa izin tertulis dari pemilik.\n\n' +
            '© ' + new Date().getFullYear() + ' Tales Hero Indonesia. All rights reserved.',
            'color:#1a1a1a;font-size:14px;line-height:1.7;'
        );

        // ── 2. Blokir klik kanan ─────────────────────────────
        const blockContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', blockContextMenu);

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
            document.removeEventListener('keydown', blockKeys);
            document.removeEventListener('dragstart', blockDrag);
        };
    }, []);
}
