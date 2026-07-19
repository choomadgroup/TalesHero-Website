import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { asset } from '@/Lib/utils';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const LOST_HEROES = [
  { src: asset('/Image/Karakter/Art/Wukong.png'),  name: 'Wukong',  side: 'left'  },
  { src: asset('/Image/Karakter/Art/Vera.png'),    name: 'Vera',    side: 'right' },
];

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="nf-page">
      <Header />

      <main className="nf-main">
        {/* Background particles */}
        <div className="nf-bg">
          {[...Array(18)].map((_, i) => (
            <span key={i} className="nf-particle" style={{
              left: `${(i * 37 + 11) % 100}%`,
              animationDelay: `${(i * 0.4) % 5}s`,
              animationDuration: `${4 + (i % 4)}s`,
              width: i % 3 === 0 ? '6px' : '3px',
              height: i % 3 === 0 ? '6px' : '3px',
            }} />
          ))}
        </div>

        {/* Characters */}
        {LOST_HEROES.map((hero, i) => (
          <motion.div
            key={hero.name}
            className={`nf-hero nf-hero--${hero.side}`}
            initial={{ opacity: 0, x: hero.side === 'left' ? -80 : 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: i * 0.2, ease: 'easeOut' }}
          >
            <img src={hero.src} alt={hero.name} />
          </motion.div>
        ))}

        {/* Center content */}
        <motion.div
          className="nf-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="nf-404">
            <span>4</span>
            <motion.img
              src={asset('/Image/tales-hero-banner.png')}
              alt="0"
              className="nf-logo-zero"
              animate={{ rotate: [0, -8, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span>4</span>
          </div>

          <h1 className="nf-title">Hero Kamu Tersesat!</h1>
          <p className="nf-desc">
            Halaman yang kamu cari tidak ada di peta dungeon kami.<br />
            Kembali ke base sebelum monster menemukanmu!
          </p>

          <div className="nf-actions">
            <button className="btn-yellow nf-btn" onClick={() => setLocation('/')}>
              Kembali ke Beranda
            </button>
            <button className="game-login-btn nf-btn" onClick={() => window.history.back()}>
              Halaman Sebelumnya
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
