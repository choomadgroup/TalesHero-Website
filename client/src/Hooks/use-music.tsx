import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { asset } from '@/Lib/utils';

interface MusicCtx {
    musicOn: boolean;
    toggleMusic: () => void;
}

const MusicContext = createContext<MusicCtx>({ musicOn: false, toggleMusic: () => {} });

export function MusicProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [musicOn, setMusicOn] = useState(false);

    useEffect(() => {
        const audio = new Audio(asset('/Sound/Talesrunner soundtrack 01 - Park & Farm.mp3'));
        audio.loop   = true;
        audio.volume = 0.4;
        audioRef.current = audio;

        // Try immediate autoplay; fall back to first user interaction
        audio.play()
            .then(() => setMusicOn(true))
            .catch(() => {
                const tryPlay = () => {
                    audio.play().then(() => setMusicOn(true)).catch(() => {});
                };
                window.addEventListener('pointerdown', tryPlay, { once: true });
            });

        return () => { audio.pause(); audio.src = ''; };
    }, []);

    const toggleMusic = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (musicOn) { audio.pause(); setMusicOn(false); }
        else { audio.play().then(() => setMusicOn(true)).catch(() => {}); }
    };

    return (
        <MusicContext.Provider value={{ musicOn, toggleMusic }}>
            {children}
        </MusicContext.Provider>
    );
}

export const useMusic = () => useContext(MusicContext);
