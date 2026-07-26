import { motion } from 'framer-motion';

interface Props {
  /** Jumlah baris field yang ditampilkan (default 3) */
  rows?: number;
  /** Label teks di bawah skeleton (default 'Memproses...') */
  label?: string;
}

/**
 * Skeleton shimmer yang ditampilkan di dalam card form saat loading.
 * Gunakan di dalam AnimatePresence agar transisi masuk/keluar mulus.
 */
export default function FormSkeleton({ rows = 3, label = 'Memproses...' }: Props) {
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
