import { useEffect, useRef, useState } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Home from '@/Pages/Home';
import Login from '@/Pages/Login';
import Daftar from '@/Pages/Daftar';
import Download from '@/Pages/Download';
import Support from '@/Pages/Support';
import GuidesPengantar from '@/Pages/Guides/Pengantar';
import GuidesKarakter from '@/Pages/Guides/Karakter';
import GuidesCombat from '@/Pages/Guides/Combat';
import GuidesItem from '@/Pages/Guides/Item';
import NotFound from '@/Pages/Not-Found';

function MusicPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const audio = new Audio('/Sound/BGM Tales Hero Indonesia.mp3');
        audio.loop = true;
        audio.volume = 0.4;
        audioRef.current = audio;

        const tryPlay = () => {
            audio.play().then(() => {
                setPlaying(true);
                setStarted(true);
            }).catch(() => {
                // Autoplay blocked — wait for user interaction
            });
        };

        tryPlay();

        const onInteract = () => {
            if (!started && audioRef.current) {
                audioRef.current.play().then(() => {
                    setPlaying(true);
                    setStarted(true);
                }).catch(() => {});
            }
        };
        document.addEventListener('click', onInteract, { once: true });
        document.addEventListener('keydown', onInteract, { once: true });

        return () => {
            audio.pause();
            audio.src = '';
            document.removeEventListener('click', onInteract);
            document.removeEventListener('keydown', onInteract);
        };
    }, []);

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
            setPlaying(false);
        } else {
            audio.play().then(() => {
                setPlaying(true);
                setStarted(true);
            }).catch(() => {});
        }
    };

    return (
        <button
            onClick={toggle}
            title={playing ? 'Pause musik' : 'Play musik'}
            style={{
                position: 'fixed',
                bottom: '1.25rem',
                right: '1.25rem',
                zIndex: 9999,
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(20,10,40,0.85)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
                transition: 'transform 0.15s, background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
            {playing ? '⏸' : '▶'}
        </button>
    );
}

function Router() {
    return (
        <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/daftar" component={Daftar} />
            <Route path="/download" component={Download} />
            <Route path="/support" component={Support} />
            <Route path="/guides/pengantar" component={GuidesPengantar} />
            <Route path="/guides/karakter" component={GuidesKarakter} />
            <Route path="/guides/combat" component={GuidesCombat} />
            <Route path="/guides/item" component={GuidesItem} />
            <Route component={NotFound} />
        </Switch>
    );
}

function App() {
    return (
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <MusicPlayer />
            <Router />
        </WouterRouter>
    );
}

export default App;
