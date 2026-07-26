import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { asset } from '@/Lib/utils';

interface MusicCtx {
    musicOn: boolean;
    toggleMusic: () => void;
}

const MusicContext = createContext<MusicCtx>({ musicOn: false, toggleMusic: () => {} });

export function MusicProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioInitialized = useRef(false);
    const [musicOn, setMusicOn] = useState(false);

    const getAudio = () => {
        if (audioRef.current) return audioRef.current;
        const audio = new Audio(asset('/Sound/Talesrunner soundtrack 01 - Park & Farm.mp3'));
        audio.loop   = true;
        audio.volume = 0.4;
        audioRef.current = audio;
        audioInitialized.current = true;
        return audio;
    };

    useEffect(() => () => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.src = '';
    }, []);

    const toggleMusic = () => {
        const audio = getAudio();
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
