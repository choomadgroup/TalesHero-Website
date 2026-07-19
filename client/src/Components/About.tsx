import { MdOutlineArrowDownward } from 'react-icons/md';
import { useLocation } from 'wouter';

const About = () => {
    const [, setLocation] = useLocation();

    return (
        <section id="about">
            <div className="about-content">
                <div style={{ marginBottom: 15 }}>
                    <p style={{ textTransform: 'uppercase', fontWeight: 500, color: '#fab005', margin: 0 }}>
                        GAME ONLINE ACTION ADVENTURE
                    </p>
                </div>

                <div style={{ marginBottom: 25 }}>
                    <p style={{ fontSize: '1.2rem', color: '#2d2d2d', margin: 0 }}>
                        Tales Hero adalah sebuah game action adventure yang menawarkan petualangan dalam berbagai legenda termashur di dunia. Ayo mainkan bersama teman-temanmu!
                    </p>
                </div>

                <div className="buttons">
                    <button className="btn-yellow btn-rounded" onClick={() => setLocation('/download')}>
                        Download <MdOutlineArrowDownward size={16} style={{ verticalAlign: 'middle' }} />
                    </button>
                    <button className="btn-default btn-rounded" onClick={() => setLocation('/daftar')}>
                        Daftar Sekarang
                    </button>
                </div>
            </div>
        </section>
    );
};

export default About;
