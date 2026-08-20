import { useLocation } from 'wouter';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import LegalDocument from '@/Components/LegalDocument';
import { usePageMeta } from '@/Hooks/use-page-meta';

export default function Legal({ type = 'terms' }: { type?: 'terms' | 'privacy' }) {
    const [, setLocation] = useLocation();
    const isPrivacy = type === 'privacy';

    usePageMeta({
        title: `${isPrivacy ? 'Privacy Policy' : 'Terms of Service'} — Tales Hero Indonesia`,
        description: isPrivacy
            ? 'Kebijakan privasi Tales Hero Indonesia.'
            : 'Ketentuan penggunaan layanan Tales Hero Indonesia.',
    });

    return (
        <>
            <Header light />
            <main className="legal-page">
                <div className="legal-page__bg" aria-hidden="true" />
                <div className="legal-page__container">
                    <div className="legal-page__heading">
                        <p className="legal-page__eyebrow">Tales Hero Indonesia</p>
                        <h1>{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h1>
                        <p>Terakhir diperbarui: 20 Agustus 2026</p>
                    </div>

                    <div className="legal-page__switcher" role="tablist" aria-label="Dokumen legal">
                        <button
                            type="button"
                            className={!isPrivacy ? 'is-active' : ''}
                            onClick={() => setLocation('/terms')}
                        >
                            Terms of Service
                        </button>
                        <button
                            type="button"
                            className={isPrivacy ? 'is-active' : ''}
                            onClick={() => setLocation('/privacy')}
                        >
                            Privacy Policy
                        </button>
                    </div>

                    <article className="legal-page__card">
                        <LegalDocument type={type} />
                    </article>
                </div>
            </main>
            <Footer />
        </>
    );
}