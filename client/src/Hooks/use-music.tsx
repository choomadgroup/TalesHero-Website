import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { asset } from '@/Lib/utils';

interface MusicCtx {
    musicOn: boolean;
    toggleMusic: () => void;
}

const MusicContext = createContext<MusicCtx>({ musicOn: false, toggleMusic: () => {} });

export function MusicProvider({ children }: { children: ReactNode }) {
    const audioRef        = useRef<HTMLAudioElement | null>(null);
    const [musicOn, setMusicOn] = useState(false);
    // Track whether the user has already triggered autoplay so we only do it once
    const autoplayed = useRef(false);

    const getAudio = () => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio(asset('/Sound/BGM Tales Hero Indonesia.mp3'));
        audio.loop   = true;
        audio.volume = 0.4;
        audioRef.current = audio;
        return audio;
    };

    // Autoplay on first user interaction — browsers require a gesture before
    // any audio can play, so we hook the earliest possible touch/click/key.
    useEffect(() => {
        const tryAutoplay = () => {
            if (autoplayed.current) return;
            autoplayed.current = true;
            const audio = getAudio();
            audio.play()
                .then(() => setMusicOn(true))
                .catch(() => { /* user or browser rejected — silently skip */ });
            // Remove listeners after first trigger
            window.removeEventListener('click',      tryAutoplay);
            window.removeEventListener('touchstart', tryAutoplay);
            window.removeEventListener('keydown',    tryAutoplay);
            window.removeEventListener('scroll',     tryAutoplay);
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
        <MusicContext.Provider value={{ musicOn, toggleMusic }}>
            {children}
        </MusicContext.Provider>
    );
}

export const useMusic = () => useContext(MusicContext);
