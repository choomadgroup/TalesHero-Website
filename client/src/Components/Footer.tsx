import { Link } from 'wouter';
import { FaFacebookF, FaDiscord, FaInstagram, FaTiktok } from 'react-icons/fa6';

const SOCIALS = [
    { icon: <FaFacebookF size={14} />, href: '#', label: 'Facebook' },
    { icon: <FaDiscord   size={14} />, href: '#', label: 'Discord'  },
    { icon: <FaInstagram size={14} />, href: '#', label: 'Instagram'},
    { icon: <FaTiktok    size={14} />, href: '#', label: 'TikTok'   },
];

const Footer = () => (
    <footer className="site-footer">
        <div className="site-footer__inner">
            <span className="site-footer__brand">Tales Hero Indonesia</span>

            <nav className="site-footer__links">
                <Link href="/">Beranda</Link>
                <Link href="/download">Download</Link>
                <Link href="/support">Support</Link>
            </nav>

            <div className="site-footer__socials">
                {SOCIALS.map(s => (
                    <a key={s.label} href={s.href} aria-label={s.label} className="site-footer__social">
                        {s.icon}
                    </a>
                ))}
            </div>

            <p className="site-footer__copy">
                © 2025 Rhaon Entertainment. All rights reserved.
            </p>
        </div>
    </footer>
);

export default Footer;
