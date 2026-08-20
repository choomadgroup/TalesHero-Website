import { useEffect, useState } from 'react';
import { IoCheckmarkCircleOutline, IoClose } from 'react-icons/io5';
import LegalDocument from '@/Components/LegalDocument';

type LegalTab = 'terms' | 'privacy';

interface LegalConsentModalProps {
    open: boolean;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    onAccept: () => void;
    onClose: () => void;
}

export default function LegalConsentModal({
    open,
    checked,
    onCheckedChange,
    onAccept,
    onClose,
}: LegalConsentModalProps) {
    const [tab, setTab] = useState<LegalTab>('terms');

    useEffect(() => {
        if (!open) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="legal-consent-overlay" onMouseDown={onClose}>
            <section
                className="legal-consent-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="legal-consent-title"
                onMouseDown={event => event.stopPropagation()}
            >
                <header className="legal-consent-modal__header">
                    <div>
                        <p className="legal-consent-modal__eyebrow">Sebelum melanjutkan</p>
                        <h2 id="legal-consent-title">Terms &amp; Privacy</h2>
                    </div>
                    <button type="button" className="legal-consent-modal__close" onClick={onClose} aria-label="Tutup">
                        <IoClose size={22} />
                    </button>
                </header>

                <div className="legal-consent-modal__tabs" role="tablist" aria-label="Dokumen legal">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'terms'}
                        className={tab === 'terms' ? 'is-active' : ''}
                        onClick={() => setTab('terms')}
                    >
                        Terms of Service
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === 'privacy'}
                        className={tab === 'privacy' ? 'is-active' : ''}
                        onClick={() => setTab('privacy')}
                    >
                        Privacy Policy
                    </button>
                </div>

                <div className="legal-consent-modal__body">
                    <LegalDocument type={tab} />
                </div>

                <footer className="legal-consent-modal__footer">
                    <label className="legal-consent-modal__check">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={event => onCheckedChange(event.target.checked)}
                        />
                        <span className="legal-consent-modal__checkmark"><IoCheckmarkCircleOutline size={18} /></span>
                        <span>Saya telah membaca dan menyetujui Terms of Service serta Privacy Policy.</span>
                    </label>
                    <button
                        type="button"
                        className="legal-consent-modal__accept"
                        disabled={!checked}
                        onClick={onAccept}
                    >
                        Setuju &amp; Lanjutkan
                    </button>
                </footer>
            </section>
        </div>
    );
}