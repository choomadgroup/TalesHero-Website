import { Link } from 'wouter';

const Footer = () => (
    <footer className="site-footer">
        <div className="site-footer__inner">
            <span className="site-footer__brand">Tales Hero Indonesia</span>
            <nav className="site-footer__links">
                <Link href="/">Beranda</Link>
                <Link href="/download">Download</Link>
                <Link href="/support">Support</Link>
            </nav>
            <p className="site-footer__copy">
                © 2025 Tales Hero ID · Unofficial fan site · Gambar &amp; data milik Rhaon Entertainment
            </p>
        </div>
    </footer>
);

export default Footer;
