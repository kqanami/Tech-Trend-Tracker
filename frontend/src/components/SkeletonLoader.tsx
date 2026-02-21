export function ArticleSkeleton() {
    return (
        <div className="cosmic-card min-h-[580px] flex flex-col animate-pulse">
            <div className="h-48 bg-white/5 rounded-lg mb-6" />
            <div className="flex-1 space-y-4">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
                <div className="h-20 bg-white/5 rounded" />
                <div className="h-1 bg-white/5 rounded" />
            </div>
        </div>
    )
}

export function TrendSkeleton() {
    return (
        <div className="cosmic-card p-4 animate-pulse">
            <div className="h-6 bg-white/5 rounded w-2/3 mb-4" />
            <div className="h-4 bg-white/5 rounded w-full mb-2" />
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-1 bg-white/5 rounded mt-4" />
        </div>
    )
}

export function StatCardSkeleton() {
    return (
        <div className="cosmic-card h-full animate-pulse">
            <div className="h-12 bg-white/5 rounded w-1/2 mb-4" />
            <div className="h-8 bg-white/5 rounded w-1/3" />
        </div>
    )
}

export function ChartSkeleton() {
    return (
        <div className="cosmic-card h-[400px] animate-pulse">
            <div className="h-6 bg-white/5 rounded w-1/4 mb-6" />
            <div className="h-full bg-white/5 rounded" />
        </div>
    )
}

