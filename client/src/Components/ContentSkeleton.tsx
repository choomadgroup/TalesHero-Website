interface ContentSkeletonProps {
    rows?: number;
    className?: string;
}

export function ContentSkeleton({ rows = 3, className = '' }: ContentSkeletonProps) {
    return (
        <div className={`content-skeleton ${className}`.trim()} aria-label="Memuat konten" aria-busy="true">
            {Array.from({ length: rows }).map((_, index) => (
                <div className="content-skeleton__row" key={index}>
                    <span className="content-skeleton__avatar" />
                    <span className="content-skeleton__copy">
                        <span className="content-skeleton__line content-skeleton__line--title" />
                        <span className="content-skeleton__line" />
                        <span className="content-skeleton__line content-skeleton__line--short" />
                    </span>
                </div>
            ))}
        </div>
    );
}

export function CardSkeletonGrid({ count = 6, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`card-skeleton-grid ${className}`.trim()} aria-label="Memuat konten" aria-busy="true">
            {Array.from({ length: count }).map((_, index) => (
                <div className="card-skeleton" key={index}>
                    <span className="card-skeleton__image" />
                    <span className="card-skeleton__line card-skeleton__line--title" />
                    <span className="card-skeleton__line" />
                    <span className="card-skeleton__line card-skeleton__line--short" />
                </div>
            ))}
        </div>
    );
}