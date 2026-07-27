import { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement,
                options: {
                    sitekey: string;
                    callback: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: () => void;
                    theme?: 'light' | 'dark' | 'auto';
                },
            ) => string;
            remove: (widgetId: string) => void;
            reset: (widgetId?: string) => void;
        };
    }
}

type Props = {
    onToken: (token: string) => void;
    resetKey?: number;
};

const IS_DEV = import.meta.env.DEV;

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            'script[data-turnstile-script]',
        );
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error('Turnstile gagal dimuat.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Turnstile gagal dimuat.'));
        document.head.appendChild(script);
    });
    return scriptPromise;
}

export default function TurnstileWidget({ onToken, resetKey = 0 }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [siteKey, setSiteKey] = useState('');
    const [loadError, setLoadError] = useState('');

    // Dev mode: auto-provide bypass token tanpa load widget Cloudflare
    useEffect(() => {
        if (IS_DEV) onToken('dev-bypass');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    // Production: ambil site key dari server
    useEffect(() => {
        if (IS_DEV) return;
        let cancelled = false;
        fetch('/api/config/turnstile')
            .then(response => {
                if (!response.ok) throw new Error('Turnstile belum dikonfigurasi.');
                return response.json();
            })
            .then(data => {
                if (!cancelled) setSiteKey(data.siteKey ?? '');
            })
            .catch(error => {
                if (!cancelled) setLoadError(error.message);
            });
        return () => { cancelled = true; };
    }, []);

    // Production: render widget setelah site key tersedia
    useEffect(() => {
        if (IS_DEV || !siteKey || !containerRef.current) return;
        let cancelled = false;

        loadTurnstileScript()
            .then(() => {
                if (cancelled || !containerRef.current || !window.turnstile) return;
                if (widgetIdRef.current) {
                    window.turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                }
                containerRef.current.replaceChildren();
                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: onToken,
                    'expired-callback': () => onToken(''),
                    'error-callback': () => onToken(''),
                    theme: 'light',
                });
            })
            .catch(error => {
                if (!cancelled) setLoadError(error.message);
            });

        return () => {
            cancelled = true;
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [siteKey, resetKey, onToken]);

    if (IS_DEV) {
        return (
            <div className="turnstile-widget" style={{ opacity: 0.5, fontSize: 12, color: '#888', padding: '8px 0' }}>
                ✓ Captcha dilewati (dev mode)
            </div>
        );
    }

    return (
        <div className="turnstile-widget" aria-live="polite">
            <div ref={containerRef} />
            {loadError && <p className="turnstile-widget__error">{loadError}</p>}
        </div>
    );
}
