import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dipakai untuk build widget Tales Hero yang bisa di-embed di situs lain.
// Jalankan: npm run build:widget → menghasilkan dist/tales-hero-widget.umd.js

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      name: 'TalesHeroWidget',
      fileName: (format) => `tales-hero-widget.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
