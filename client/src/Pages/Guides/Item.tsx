import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
    IoCubeOutline,
    IoLayersOutline,
    IoSearch,
    IoChevronBack,
    IoChevronForward,
    IoClose,
    IoSparklesOutline,
} from 'react-icons/io5';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { usePageMeta } from '@/Hooks/use-page-meta';

type CatalogueMode = 'owned' | 'all';
type ItemKind = 'all' | 'equipment' | 'package';

type Variant = {
    itemNum: number;
    itemName: string;
    expiresMinutes: number;
    hasExpireTime: boolean;
};

type GameItem = {
    itemNum: number;
    itemName: string;
    description: string;
    type: number;
    position: number;
    itemKind: number;
    character: number;
    owners: number;
    ownedCount: number;
    variantCount: number;
    isPackage: boolean;
    isVariant: boolean;
    baseItemNum: number;
    imageCandidates: string[];
    variants: Variant[];
};

type ItemsResponse = {
    items: GameItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    mode: CatalogueMode;
    kind: ItemKind;
    message?: string;
};

function stripGameMarkup(value: string) {
    return value
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function positionLabel(position: number) {
    const labels: Record<number, string> = {
        1: 'Kepala',
        2: 'Baju',
        3: 'Bawahan',
        4: 'Sepatu',
        5: 'Aksesori',
    };
    return labels[position] ?? (position ? `Posisi ${position}` : 'Item game');
}

function formatDuration(minutes: number) {
    if (!minutes) return '';
    if (minutes >= 43200) return `${Math.round(minutes / 43200)} bulan`;
    if (minutes >= 1440) return `${Math.round(minutes / 1440)} hari`;
    return `${Math.round(minutes / 60)} jam`;
}

function ItemImage({ item }: { item: GameItem }) {
    const [candidateIndex, setCandidateIndex] = useState(0);
    const source = item.imageCandidates[candidateIndex];

    if (!source) {
        return (
            <div className="item-guide-card__image-fallback">
                <IoCubeOutline size={36} />
                <span>Tanpa ikon</span>
            </div>
        );
    }

    return (
        <img
            className="item-guide-card__image"
            src={source}
            alt={item.itemName}
            loading="lazy"
            onError={() => setCandidateIndex((value) => value + 1)}
        />
    );
}

function ItemCard({ item, onOpen }: { item: GameItem; onOpen: (item: GameItem) => void }) {
    const description = stripGameMarkup(item.description);

    return (
        <button className="item-guide-card" onClick={() => onOpen(item)}>
            <div className="item-guide-card__image-wrap">
                <ItemImage item={item} />
                <span className="item-guide-card__id">#{item.itemNum}</span>
                {item.isPackage && (
                    <span className="item-guide-card__package">
                        <IoLayersOutline size={12} /> Paket
                    </span>
                )}
            </div>
            <div className="item-guide-card__content">
                <span className="item-guide-card__position">{positionLabel(item.position)}</span>
                <h3>{item.itemName}</h3>
                <p>{description || 'Belum ada deskripsi item.'}</p>
                <div className="item-guide-card__meta">
                    {item.isPackage
                        ? `${item.variantCount} varian waktu`
                        : item.isVariant
                            ? `Bagian dari item #${item.baseItemNum}`
                            : 'Item tunggal'}
                    {item.owners > 0 && <span>{item.owners.toLocaleString('id-ID')} pemilik</span>}
                </div>
            </div>
        </button>
    );
}

function ItemModal({ item, onClose }: { item: GameItem; onClose: () => void }) {
    const description = stripGameMarkup(item.description);

    return (
        <div className="item-guide-modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <div className="item-guide-modal" role="dialog" aria-modal="true" aria-label={item.itemName}>
                <button className="item-guide-modal__close" onClick={onClose} aria-label="Tutup">
                    <IoClose size={20} />
                </button>
                <div className="item-guide-modal__visual">
                    <ItemImage item={item} />
                </div>
                <div className="item-guide-modal__body">
                    <span className="item-guide-card__position">{positionLabel(item.position)}</span>
                    <h2>{item.itemName}</h2>
                    <p className="item-guide-modal__id">Item #{item.itemNum}</p>
                    <p className="item-guide-modal__description">
                        {description || 'Belum ada deskripsi item di database game.'}
                    </p>
                    <div className="item-guide-modal__stats">
                        <span><b>Type</b> {item.type}</span>
                        <span><b>Kind</b> {item.itemKind}</span>
                        {item.character > 0 && <span><b>Character</b> {item.character}</span>}
                    </div>
                    {item.isPackage && (
                        <div className="item-guide-modal__variants">
                            <h3><IoLayersOutline size={16} /> Varian / isi paket</h3>
                            {item.variants.map((variant) => (
                                <div key={variant.itemNum}>
                                    <span>{variant.itemName}</span>
                                    <small>
                                        {variant.hasExpireTime && variant.expiresMinutes
                                            ? formatDuration(variant.expiresMinutes)
                                            : 'Versi item'}
                                    </small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GuidesItem() {
    const [, setLocation] = useLocation();
    const [mode, setMode] = useState<CatalogueMode>('owned');
    const [kind, setKind] = useState<ItemKind>('all');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<ItemsResponse | null>(null);
    const [selected, setSelected] = useState<GameItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    usePageMeta({
        title: 'Item & Costume — Tales Hero Indonesia',
        description: 'Lihat item, costume, dan paket item Tales Hero dari database game.',
    });

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        const params = new URLSearchParams({
            mode,
            kind,
            page: String(page),
            limit: '24',
        });
        if (search) params.set('search', search);

        fetch(`/api/items?${params}`, { signal: controller.signal })
            .then(async (response) => {
                const body = await response.json() as ItemsResponse;
                if (!response.ok) throw new Error(body.message || 'Gagal memuat katalog item.');
                return body;
            })
            .then(setData)
            .catch((reason: unknown) => {
                if ((reason as { name?: string })?.name !== 'AbortError') {
                    setError(reason instanceof Error ? reason.message : 'Gagal memuat katalog item.');
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [mode, kind, page, search]);

    const title = mode === 'owned' ? 'Item yang Dimiliki Pemain' : 'Semua Item Game';
    const countLabel = useMemo(() => (
        data ? `${data.total.toLocaleString('id-ID')} item ditemukan` : 'Memuat item…'
    ), [data]);

    const changeMode = useCallback((nextMode: CatalogueMode) => {
        setMode(nextMode);
        setPage(1);
    }, []);

    return (
        <>
            <Header light />
            <section className="guides-hero item-guide-hero">
                <div className="guides-hero__inner">
                    <div className="guides-hero__badge">
                        <IoSparklesOutline size={16} />
                        Database Item Game
                    </div>
                    <h1 className="guides-hero__title">Item &amp; Costume</h1>
                    <p className="guides-hero__sub">
                        Jelajahi item dan costume langsung dari database game — tanpa katalog gambar manual.
                    </p>
                    <button className="game-cta-btn" onClick={() => setLocation('/daftar')}>
                        Daftar &amp; Main Sekarang
                    </button>
                </div>
            </section>

            <div className="guides-breadcrumb">
                <span onClick={() => setLocation('/')} className="guides-breadcrumb__link">Beranda</span>
                <span className="guides-breadcrumb__sep">›</span>
                <span className="guides-breadcrumb__link guides-breadcrumb__link--active">Item &amp; Costume</span>
            </div>

            <main className="item-guide-page">
                <div className="item-guide-toolbar">
                    <div className="item-guide-tabs" role="tablist" aria-label="Sumber katalog">
                        <button className={mode === 'owned' ? 'is-active' : ''} onClick={() => changeMode('owned')}>
                            <IoLayersOutline size={17} /> Dimiliki Pemain
                        </button>
                        <button className={mode === 'all' ? 'is-active' : ''} onClick={() => changeMode('all')}>
                            <IoCubeOutline size={17} /> Semua Item
                        </button>
                    </div>
                    <div className="item-guide-search">
                        <IoSearch size={18} />
                        <input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Cari nama atau ID item…"
                            aria-label="Cari item"
                        />
                        {searchInput && (
                            <button onClick={() => setSearchInput('')} aria-label="Hapus pencarian">
                                <IoClose size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="item-guide-filters">
                    <span>Filter:</span>
                    {([
                        ['all', 'Semua'],
                        ['equipment', 'Equipment'],
                        ['package', 'Paket / Varian'],
                    ] as [ItemKind, string][]).map(([value, label]) => (
                        <button
                            key={value}
                            className={kind === value ? 'is-active' : ''}
                            onClick={() => { setKind(value); setPage(1); }}
                        >
                            {label}
                        </button>
                    ))}
                    <strong>{countLabel}</strong>
                </div>

                {error && <div className="item-guide-state item-guide-state--error">{error}</div>}
                {loading && (
                    <div className="item-guide-grid" aria-label="Memuat item">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div className="item-guide-skeleton" key={index} />
                        ))}
                    </div>
                )}
                {!loading && !error && data && data.items.length === 0 && (
                    <div className="item-guide-state">
                        <IoCubeOutline size={42} />
                        <h2>Tidak ada item ditemukan</h2>
                        <p>Coba ubah kata pencarian atau filter katalog.</p>
                    </div>
                )}
                {!loading && !error && data && data.items.length > 0 && (
                    <>
                        <h2 className="item-guide-heading">{title}</h2>
                        <div className="item-guide-grid">
                            {data.items.map((item) => (
                                <ItemCard key={item.itemNum} item={item} onOpen={setSelected} />
                            ))}
                        </div>
                        {data.totalPages > 1 && (
                            <div className="item-guide-pagination">
                                <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                                    <IoChevronBack size={16} /> Sebelumnya
                                </button>
                                <span>Halaman {page} dari {data.totalPages}</span>
                                <button disabled={page >= data.totalPages} onClick={() => setPage((value) => value + 1)}>
                                    Berikutnya <IoChevronForward size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
            {selected && <ItemModal item={selected} onClose={() => setSelected(null)} />}
        </>
    );
}