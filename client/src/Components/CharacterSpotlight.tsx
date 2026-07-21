import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { asset } from '@/Lib/utils';

const ALL_CHARACTERS = [
    { name: 'Abel',        file: 'Abel.png',         quote: 'Keberanian sejati bukan soal tanpa rasa takut, tapi tetap melangkah meski takut!' },
    { name: 'BigBo',       file: 'BigBo.png',        quote: 'Ukuranku besar, semangatku jauh lebih besar lagi!' },
    { name: 'Bloody Vera', file: 'Bloody Vera.png',  quote: 'Merah darah adalah warna kemenanganku. Jangan dekat-dekat!' },
    { name: 'Cain',        file: 'Cain.png',         quote: 'Kegelapan bukan musuhku. Itu adalah senjataku.' },
    { name: 'Celia',       file: 'Celia.png',        quote: 'Senyumku menyimpan kekuatan yang tak pernah kamu duga.' },
    { name: 'Chloe',       file: 'Chloe.png',        quote: 'Setiap bunga punya duri. Aku adalah keduanya.' },
    { name: 'Damyeon',     file: 'Damyeon.png',      quote: 'Disiplin dan tekad — itulah dua senjata terkuatku.' },
    { name: 'Dewi',        file: 'Dewi.png',         quote: 'Alam adalah sekutuku. Bersama kami, tak ada yang mustahil.' },
    { name: 'DnD',         file: 'DnD.png',          quote: 'Bersama kami, tidak ada lawan yang bisa bertahan!' },
    { name: 'Elims',       file: 'Elims.png',        quote: 'Strategiku sempurna. Kekalahanmu sudah kutentukan sejak awal.' },
    { name: 'Harang',      file: 'Harang.png',       quote: 'Tawa dan kemenangan selalu berjalan beriringan bersamaku!' },
    { name: 'Haru',        file: 'Haru.png',         quote: 'Setiap hari adalah kesempatan baru untuk jadi lebih kuat.' },
    { name: 'Hidden Rough',file: 'Hidden Rough.png', quote: 'Tersembunyi bukan berarti lemah. Waspadai bayanganmu!' },
    { name: 'Jab',         file: 'Jab.png',          quote: 'Pukulanku cepat, tepat, dan tidak akan pernah terhindarkan!' },
    { name: 'Jaka',        file: 'Jaka.png',         quote: 'Dari desa kecil, mimpi besarku takkan pernah padam!' },
    { name: 'Kai',         file: 'Kai.png',          quote: 'Kecepatan adalah segalanya. Berkedip, kamu sudah kalah.' },
    { name: 'LaLa',        file: 'LaLa.png',         quote: 'Melodi indahku bisa menjadi senjata paling mematikan!' },
    { name: 'Luci',        file: 'Luci.png',         quote: 'Cahaya atau kegelapan? Aku memilih jalanku sendiri.' },
    { name: 'Maki',        file: 'Maki.png',         quote: 'Ketangkasanku tak tertandingi di medan perang manapun.' },
    { name: 'Miho',        file: 'Miho.png',         quote: 'Percayakan keselamatanmu padaku. Aku tak akan mengecewakan.' },
    { name: 'Mingming',    file: 'Mingming.png',     quote: 'Kecil bukan halangan. Semangatku selalu raksasa!' },
    { name: 'Narcius',     file: 'Narcius.png',      quote: 'Cermin pun kagum melihat kehebatan yang kumiliki.' },
    { name: 'R',           file: 'R.png',            quote: 'Misi diterima. Eksekusi dimulai. Kegagalan bukan opsi.' },
    { name: 'Rina',        file: 'Rina.png',         quote: 'Musikku adalah mantera. Dengarkan dan rasakan kekuatannya!' },
    { name: 'Rini',        file: 'Rini.png',         quote: 'Langkah kecilku adalah awal dari perjalanan yang panjang.' },
    { name: 'Roroa',       file: 'Roroa.png',        quote: 'Petualangan sejati dimulai saat rasa takut berhasil dikalahkan!' },
    { name: 'Rough',       file: 'Rough.png',        quote: 'Kasar di luar, tapi hatiku selalu ada untuk melindungi tim!' },
    { name: 'Sid',         file: 'Sid.png',          quote: 'Ketepatan setiap seranganku adalah mahkota kebanggaanku.' },
    { name: 'Siho',        file: 'Siho.png',         quote: 'Ketenangan dalam badai adalah kekuatanku yang sesungguhnya.' },
    { name: 'Tifanny',     file: 'Tifanny.png',      quote: 'Pesonaku membuat lawan lengah — lalu kutaklukkan mereka!' },
    { name: 'Titi',        file: 'Titi.png',         quote: 'Semangat juangku tak pernah padam walau diterpa badai apapun!' },
    { name: 'Vera',        file: 'Vera.png',         quote: 'Kecantikan dan kekuatan? Aku punya keduanya. Siap kalah?' },
    { name: 'Wukong',      file: 'Wukong.png',       quote: 'Tongkatku tak pernah salah sasaran. Ikuti aku menuju puncak!' },
    { name: 'Xionell',     file: 'Xionell.png',      quote: 'Ilmu sihirku telah kupersiapkan bertahun-tahun. Bersiaplah!' },
    { name: 'YeonOh',      file: 'YeonOh.png',       quote: 'Keanggunan dan kekuatan bersatu dalam setiap gerakanku.' },
];

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const INTERVAL = 4500;

export default function CharacterSpotlight() {
    const [idx, setIdx] = useState(() => Math.floor(Math.random() * ALL_CHARACTERS.length));
    const usedRef = useRef<Set<number>>(new Set([idx]));

    useEffect(() => {
        const pickNext = () => {
            // reset kalau semua sudah tampil
            if (usedRef.current.size >= ALL_CHARACTERS.length) usedRef.current.clear();
            let next: number;
            do { next = Math.floor(Math.random() * ALL_CHARACTERS.length); }
            while (usedRef.current.has(next));
            usedRef.current.add(next);
            setIdx(next);
        };
        const t = setInterval(pickNext, INTERVAL);
        return () => clearInterval(t);
    }, []);

    const char = ALL_CHARACTERS[idx];

    return (
        <div className="cs-wrap">
            <div className="cs-card">

                {/* Gambar karakter — kiri, center vertikal */}
                <div className="cs-img-wrap">
                    <AnimatePresence mode="sync">
                        <motion.img
                            key={`img-${idx}`}
                            src={asset(`/Image/Karakter/Art/${char.file}`)}
                            alt={char.name}
                            className="cs-img"
                            style={{ position: 'absolute' }}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.38, ease: 'easeOut' }}
                        />
                    </AnimatePresence>
                </div>

                {/* Bubble chat — kanan, center vertikal */}
                <div className="cs-bubble">
                    <div className="cs-bubble__tail" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`text-${idx}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.28 }}
                        >
                            <p className="cs-hello">✦ Halo! Aku ✦</p>
                            <h3 className="cs-name">{char.name}</h3>
                            <p className="cs-quote">"{char.quote}"</p>
                        </motion.div>
                    </AnimatePresence>

                </div>

            </div>
        </div>
    );
}
