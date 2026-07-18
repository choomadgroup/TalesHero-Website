const Footer = () => {
    return (
        <footer style={{ backgroundColor: '#fab005' }}>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, padding: '10px 20px 0' }}>
                Situs unofficial — gambar dan data milik Rhaon Entertainment.
            </p>
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-col-main">
                        <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: 10 }}>
                            Tales Hero Indonesia
                        </p>
                        <p style={{ color: 'white', marginBottom: 5 }}>
                            Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!
                        </p>
                        <p style={{ color: 'white', marginBottom: 20 }}>
                            Ikuti kami di media sosial untuk info event dan update terbaru game.
                        </p>
                        <button className="btn-white" onClick={() => window.open('#', '_blank')}>
                            Main Sekarang
                        </button>
                    </div>

                    <div className="footer-col-side">
                        <div className="footer-card">
                            <div style={{ marginBottom: 6, fontWeight: 600 }}>Tales Hero Indonesia</div>
                            <a href="#" style={{ textDecoration: 'none' }}>
                                <div className="footer-user">
                                    <div className="footer-avatar">THI</div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Tales Hero Indonesia</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>support@taleshero.id</div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
