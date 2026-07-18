import React from 'react';

// Widget embeddable Tales Hero Indonesia — build dengan Vite (npm run build:widget)
// Hasilnya berupa file JS kecil yang bisa di-embed di website manapun:
// <script src="tales-hero-widget.umd.js"></script>

const TalesHeroWidget = () => {
  return (
    <div style={{
      fontFamily: 'sans-serif',
      background: 'linear-gradient(135deg, #fab005 0%, #fd7e14 100%)',
      borderRadius: 12,
      padding: '20px 24px',
      maxWidth: 380,
      boxShadow: '0 4px 24px rgba(250, 176, 5, 0.35)',
      textAlign: 'center',
    }}>
      <img
        src="https://taleshero.id/image/tales-hero-banner.png"
        alt="Tales Hero Indonesia"
        style={{ width: '100%', marginBottom: 12, borderRadius: 8 }}
      />
      <p style={{ margin: '0 0 16px', fontSize: 14, color: 'white', lineHeight: 1.5 }}>
        Game online action adventure — petualangan dalam berbagai legenda termashur di dunia!
      </p>
      <a
        href="https://taleshero.id/daftar"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-block',
          background: 'white',
          color: '#fab005',
          fontWeight: 700,
          padding: '10px 24px',
          borderRadius: 8,
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        ⚔️ Main Sekarang — Gratis!
      </a>
    </div>
  );
};

export default TalesHeroWidget;
