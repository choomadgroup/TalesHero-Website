import { Youtube, MessageCircle, Instagram, Mail, Facebook } from "lucide-react";

const SOCIALS = [
    {
        icon: <Facebook size={20} strokeWidth={1.5} />,
        href: "#",
        label: "Facebook",
    },
    {
        icon: <Youtube size={20} strokeWidth={1.5} />,
        href: "#",
        label: "YouTube",
    },
    {
        icon: <Instagram size={20} strokeWidth={1.5} />,
        href: "#",
        label: "Instagram",
    },
    {
        icon: <MessageCircle size={20} strokeWidth={1.5} />,
        href: "https://discord.gg/rTyNWEQhxB",
        label: "Discord",
    },
    {
        icon: <Mail size={20} strokeWidth={1.5} />,
        href: "mailto:support@taleshero.web.id",
        label: "Email",
    },
];

const Footer = () => (
    <footer className="site-footer">
        <div className="site-footer__inner">
            <div className="site-footer__copy-group">
                <span>&copy; {new Date().getFullYear()}</span>
                <span className="site-footer__sep hidden-mobile">/</span>
                <strong>Tales Hero Indonesia</strong>
                <span className="site-footer__sep hidden-mobile">/</span>
                <span className="site-footer__rights">
                    Private server. Data &amp; gambar &copy; Rhaon Entertainment.
                </span>
            </div>
            <div className="site-footer__socials">
                {SOCIALS.map((s) => (
                    <a
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
                        target={s.href.startsWith("http") ? "_blank" : undefined}
                        rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="site-footer__social"
                    >
                        {s.icon}
                    </a>
                ))}
            </div>
        </div>
    </footer>
);

export default Footer;
