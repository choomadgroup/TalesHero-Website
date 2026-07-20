import { FaFacebookF, FaDiscord, FaInstagram } from "react-icons/fa6";
import { MdOutlineEmail } from "react-icons/md";

const SOCIALS = [
    { icon: <FaFacebookF size={18} />, href: "#", label: "Facebook" },
    { icon: <FaDiscord size={18} />, href: "https://discord.gg/rTyNWEQhxB", label: "Discord" },
    { icon: <FaInstagram size={18} />, href: "#", label: "Instagram" },
    {
        icon: <MdOutlineEmail size={20} />,
        href: "mailto:support@taleshero.web.id",
        label: "Email",
    },
];

const Footer = () => (
    <footer className="site-footer">
        <div className="site-footer__inner">
            <p className="site-footer__copy">
                © 2026 <span className="site-footer__sep">/</span>{" "}
                <strong>Tales Hero Indonesia</strong>{" "}
                <span className="site-footer__sep">/</span> Private server
                sumber Data dan Gambar © Rhaon Entertaiment.
            </p>
            <div className="site-footer__socials">
                {SOCIALS.map((s) => (
                    <a
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
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
