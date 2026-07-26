import { motion } from 'framer-motion';

interface Props {
  /** Jumlah baris field yang ditampilkan (default 3) */
  rows?: number;
  /** Label teks di bawah skeleton (default 'Memproses...') */
  label?: string;
  /** Bentuk skeleton khusus untuk transisi keluar dari halaman akun */
  variant?: 'form' | 'logout';
}

/**
 * Skeleton shimmer yang ditampilkan di dalam card form saat loading.
 * Gunakan di dalam AnimatePresence agar transisi masuk/keluar mulus.
 */
export default function FormSkeleton({ rows = 3, label = 'Memproses...', variant = 'form' }: Props) {
  if (variant === 'logout') {
    return (
      <motion.div
        className="form-skeleton form-skeleton--logout"
        key="logout-skeleton"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2 }}
      >
        <div className="form-skeleton__logout-avatar" />
        <div className="form-skeleton__logout-copy">
          <div className="form-skeleton__logout-title" />
          <div className="form-skeleton__logout-line" />
        </div>
        <div className="form-skeleton__logout-status">{label}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="form-skeleton"
      key="form-skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Baris judul */}
      <div className="form-skeleton__title" />

      {/* Baris field */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="form-skeleton__field">
          <div className="form-skeleton__label" style={{ width: `${45 + (i % 3) * 15}%` }} />
          <div className="form-skeleton__input" />
        </div>
      ))}

      {/* Tombol */}
      <div className="form-skeleton__btn" />

      {/* Label teks */}
      <p className="form-skeleton__label-text">{label}</p>
    </motion.div>
  );
}
