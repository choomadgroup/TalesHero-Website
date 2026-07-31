import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { asset } from '@/Lib/utils';

interface MusicCtx {
    musicOn:     boolean;
    toggleMusic: () => void;
    pauseMusic:  () => void;
}

const MusicContext = createContext<MusicCtx>({
    musicOn:     false,
    toggleMusic: () => {},
    pauseMusic:  () => {},
});

/** Returns true when the current page is the admin dashboard. */
function isAdminPage() {
    return window.location.pathname.replace(/\/$/, '').endsWith('/dashboard/admin');
}

export function MusicProvider({ children }: { children: ReactNode }) {
    const audioRef   = useRef<HTMLAudioElement | null>(null);
    const autoplayed = useRef(false);
    const [musicOn, setMusicOn] = useState(false);

    const getAudio = () => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio(asset('/Sound/BGM Tales Hero Indonesia.mp3'));
        audio.loop   = true;
        audio.volume = 0.4;
        audioRef.current = audio;
        return audio;
    };

    // Autoplay on first user interaction — skip entirely on /admin.
    useEffect(() => {
        const tryAutoplay = () => {
            if (autoplayed.current) return;
            autoplayed.current = true;

            // Never autoplay on the admin dashboard
            if (isAdminPage()) return;

            const audio = getAudio();
            audio.play()
                .then(() => setMusicOn(true))
                .catch(() => {});
        };

        window.addEventListener('click',      tryAutoplay, { once: true, passive: true });
        window.addEventListener('touchstart', tryAutoplay, { once: true, passive: true });
        window.addEventListener('keydown',    tryAutoplay, { once: true, passive: true });
        window.addEventListener('scroll',     tryAutoplay, { once: true, passive: true });

        return () => {
            window.removeEventListener('click',      tryAutoplay);
            window.removeEventListener('touchstart', tryAutoplay);
            window.removeEventListener('keydown',    tryAutoplay);
            window.removeEventListener('scroll',     tryAutoplay);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cleanup on unmount
    useEffect(() => () => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.src = '';
    }, []);

    const pauseMusic = () => {
        audioRef.current?.pause();
        setMusicOn(false);
    };

    const toggleMusic = () => {
        const audio = getAudio();
        if (musicOn) {
            audio.pause();
            setMusicOn(false);
        } else {
            audio.play().then(() => setMusicOn(true)).catch(() => {});
        }
    };

    return (
        <MusicContext.Provider value={{ musicOn, toggleMusic, pauseMusic }}>
            {children}
        </MusicContext.Provider>
    );
}

export const useMusic = () => useContext(MusicContext);
