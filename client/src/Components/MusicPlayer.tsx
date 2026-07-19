import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMusicalNotes, IoPause, IoPlay } from 'react-icons/io5';

export default function MusicPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [ready, setReady] = useState(false);
    const [visible, setVisible] = useState(false);

    // attempt autoplay after first user gesture OR on mount
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.4;
        audio.loop   = true;

        const tryPlay = () => {
            audio.play()
                .then(() => { setPlaying(true); setVisible(true); })
                .catch(() => { setVisible(true); }); // browser blocked — show button anyway
        };

        // try immediately (works on some browsers / after first interaction)
        tryPlay();

        // also try on first interaction if autoplay was blocked
        const onInteract = () => {
            if (!playing) tryPlay();
            window.removeEventListener('pointerdown', onInteract);
        };
        window.addEventListener('pointerdown', onInteract);
        return () => window.removeEventListener('pointerdown', onInteract);
    }, []);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
            setPlaying(false);
        } else {
            audio.play().then(() => setPlaying(true));
        }
    };

    return (
        <>
            <audio ref={audioRef} src="/Music/bgm.mp3" onCanPlay={() => setReady(true)} preload="auto" />

            <AnimatePresence>
                {visible && (
                    <motion.button
                        className={`music-btn ${playing ? 'music-btn--playing' : ''}`}
                        onClick={toggle}
                        aria-label={playing ? 'Jeda musik' : 'Putar musik'}
                        title={playing ? 'Jeda musik' : 'Putar musik'}
                        initial={{ opacity: 0, scale: 0.6, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.35 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {/* spinning vinyl ring when playing */}
                        <span className="music-btn__ring" />
                        <span className="music-btn__icon">
                            {playing ? <IoPause size={18} /> : <IoPlay size={18} />}
                        </span>

                        {/* sound-wave bars */}
                        {playing && (
                            <span className="music-btn__waves" aria-hidden>
                                {[1,2,3,4].map(i => (
                                    <span key={i} className="music-btn__bar" style={{ animationDelay: `${i * 0.12}s` }} />
                                ))}
                            </span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}
