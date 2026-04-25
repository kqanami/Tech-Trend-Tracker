/**
 * Reusable skeleton loader components for loading states.
 * Usage: <SkeletonCard /> or <SkeletonArticle /> etc.
 */

const shimmer = "animate-pulse bg-white/5 rounded"

/** Generic skeleton block */
export const SkeletonBox = ({ className = "" }: { className?: string }) => (
    <div className={`${shimmer} ${className}`} />
)

/** Article / generic card skeleton */
export const SkeletonCard = () => (
    <div className="cosmic-card flex flex-col gap-4">
        {/* Tag + badge */}
        <div className="flex items-center justify-between">
            <SkeletonBox className="h-5 w-20 rounded-full" />
            <SkeletonBox className="h-5 w-12 rounded-full" />
        </div>
        {/* Title */}
        <SkeletonBox className="h-6 w-full" />
        <SkeletonBox className="h-6 w-4/5" />
        {/* Summary */}
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-4 w-2/3" />
        {/* Footer */}
        <div className="flex items-center gap-3 mt-2">
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-4 w-24" />
        </div>
    </div>
)

/** Stat card skeleton (for dashboard) */
export const SkeletonStat = () => (
    <div className="cosmic-card flex flex-col gap-3">
        <div className="flex items-center gap-2">
            <SkeletonBox className="h-5 w-5 rounded-lg" />
            <SkeletonBox className="h-4 w-24" />
        </div>
        <SkeletonBox className="h-10 w-32" />
        <SkeletonBox className="h-3 w-20" />
    </div>
)

/** Table row skeleton */
export const SkeletonRow = () => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/5">
        <SkeletonBox className="h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-48" />
            <SkeletonBox className="h-3 w-32" />
        </div>
        <SkeletonBox className="h-6 w-16 rounded-full shrink-0" />
    </div>
)

/** Repo card skeleton */
export const SkeletonRepo = () => (
    <div className="cosmic-card flex flex-col gap-4">
        <div className="flex justify-between">
            <SkeletonBox className="h-5 w-20 rounded-full" />
            <SkeletonBox className="h-5 w-14" />
        </div>
        <SkeletonBox className="h-6 w-3/4" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-4/5" />
        <div className="grid grid-cols-2 gap-3 mt-2">
            <SkeletonBox className="h-16 rounded-xl" />
            <SkeletonBox className="h-16 rounded-xl" />
        </div>
        <SkeletonBox className="h-2 w-full rounded-full mt-2" />
    </div>
)

/** Grid of skeleton cards */
export const SkeletonGrid = ({ count = 6, Component = SkeletonCard }: { count?: number; Component?: React.ComponentType }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <Component key={i} />
        ))}
    </div>
)
