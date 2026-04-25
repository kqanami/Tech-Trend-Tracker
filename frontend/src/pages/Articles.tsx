import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { articlesAPI, exportAPI } from '../api/client'
import {
    Search, Filter, ExternalLink, Tag, Calendar, Heart, Download,
    Newspaper, TrendingUp, Clock, Eye, Zap, BarChart3, Layers,
    ChevronRight, ArrowUpRight, Sparkles, BookOpen
} from 'lucide-react'
import SimilarArticles from '../components/SimilarArticles'
import ArticleAnalysis from '../components/ArticleAnalysis'
import { useFavorites } from '../hooks/useFavorites'
import { useToast } from '../components/Toast'
import { ArticleSkeleton } from '../components/SkeletonLoader'
import { NoArticles } from '../components/EmptyState'

// ── Sentiment Indicator ───────────────────────────────────────────────────────
function SentimentDot({ score }: { score?: number }) {
    if (score == null) return null
    const color = score > 0.1 ? 'bg-emerald-400' : score < -0.1 ? 'bg-red-400' : 'bg-gray-400'
    const label = score > 0.1 ? 'Positive' : score < -0.1 ? 'Negative' : 'Neutral'
    return (
        <div className="flex items-center gap-1.5" title={`Sentiment: ${label} (${score.toFixed(2)})`}>
            <div className={`w-2 h-2 rounded-full ${color} shadow-sm`} />
            <span className="text-[10px] text-gray-500 font-bold">{label}</span>
        </div>
    )
}

// ── Category Pill ─────────────────────────────────────────────────────────────
function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap border ${active
                ? 'bg-cosmic-500/20 text-cosmic-300 border-cosmic-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                }`}
        >
            {label}
        </button>
    )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'text-cosmic-400' }: {
    icon: React.ElementType; label: string; value: string | number; color?: string
}) {
    return (
        <div className="cosmic-card group">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
        </div>
    )
}

// ── Featured Article Card ─────────────────────────────────────────────────────
function FeaturedArticle({ article, isFav, onToggleFav }: { article: any; isFav: boolean; onToggleFav: () => void }) {
    return (
        <article className="cosmic-card !p-0 overflow-hidden group relative lg:col-span-2 lg:row-span-2 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cosmic-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
            {article.image_url && (
                <div className="relative h-64 overflow-hidden">
                    <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 bg-cosmic-500/30 backdrop-blur-md border border-cosmic-500/30 rounded-full text-[10px] font-bold text-cosmic-300 uppercase tracking-wider">
                                ⚡ Featured
                            </span>
                            <span className="px-2.5 py-0.5 bg-space-950/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                                {article.source}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-cosmic-400 bg-cosmic-500/10 px-2 py-0.5 rounded border border-cosmic-500/20">
                        {article.category || 'Technology'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                        {article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </span>
                    <SentimentDot score={article.sentiment_score} />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-3 leading-tight group-hover:text-cosmic-400 transition-colors">
                    {article.title}
                </h2>
                <p className="text-sm text-gray-400 line-clamp-4 mb-4 leading-relaxed flex-1">
                    {article.summary}
                </p>
                <ArticleAnalysis technicalAnalysis={article.technical_analysis} sentimentScore={article.sentiment_score} compact={true} />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-wrap gap-1">
                        {article.tags?.slice(0, 4).map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-gray-500 font-bold">
                                #{tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.preventDefault(); onToggleFav() }}
                            className={`p-1.5 rounded-lg transition-colors ${isFav ? 'text-red-400 bg-red-500/20' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'}`}
                        >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                        <a
                            href={article.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cosmic-500/20 border border-cosmic-500/30 rounded-lg text-xs font-bold text-cosmic-300 hover:bg-cosmic-500/30 transition-all"
                        >
                            Read <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            </div>
        </article>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Articles() {
    const { showToast } = useToast()
    const { isFavorite, toggleFavorite } = useFavorites()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [source, setSource] = useState('All')
    const [category, setCategory] = useState('All')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [showDateFilters, setShowDateFilters] = useState(false)
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ['articles', page, search, source, category, startDate, endDate],
        queryFn: async () => {
            const response = await articlesAPI.getAll({
                page,
                page_size: 12,
                search: search || undefined,
                source: source === 'All' ? undefined : source,
                category: category === 'All' ? undefined : category,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            } as any)
            return response.data
        },
        refetchInterval: 15 * 60 * 1000,
    })

    const stats = useMemo(() => {
        if (!data?.items?.length) return null
        const items = data.items
        const avgSentiment = items.reduce((s, a) => s + (a.sentiment_score || 0), 0) / items.length
        const withAnalysis = items.filter(a => a.technical_analysis).length
        const sourceCounts = new Map<string, number>()
        items.forEach(a => sourceCounts.set(a.source, (sourceCounts.get(a.source) || 0) + 1))
        const topSource = Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1])[0]
        return { avgSentiment, withAnalysis, total: data.total, topSource: topSource?.[0] || 'N/A' }
    }, [data])

    const handleExport = async () => {
        try {
            const response = await exportAPI.exportArticlesCSV({
                source: source === 'All' ? undefined : source,
                category: category === 'All' ? undefined : category,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `articles_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            showToast('Articles exported successfully!', 'success')
        } catch {
            showToast('Failed to export articles', 'error')
        }
    }

    const sources = ['All', 'TechCrunch', 'HackerNews', 'ArXiv']
    const categories = ['All', 'AI', 'Web', 'Mobile', 'Crypto', 'Cloud', 'DevOps']

    // First article gets featured treatment
    const featured = page === 1 && !search && source === 'All' && category === 'All' ? data?.items?.[0] : null
    const restArticles = featured ? data?.items?.slice(1) : data?.items

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* ── Hero Header ──────────────────────────────────────────── */}
            <div className="relative text-center py-8">
                <div className="absolute inset-0 bg-gradient-to-b from-cosmic-500/5 to-transparent rounded-3xl" />
                <div className="relative">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="relative">
                            <Newspaper className="w-12 h-12 text-cosmic-400" />
                            <div className="absolute inset-0 blur-xl bg-cosmic-500/30 animate-pulse" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text tracking-tight">
                            Intelligence Feed
                        </h1>
                    </div>
                    <p className="text-gray-400 font-light max-w-2xl mx-auto text-sm md:text-base">
                        Decrypting the latest signals from the technology frontline with deep-space AI analysis.
                    </p>
                </div>
            </div>

            {/* ── Stats Row ────────────────────────────────────────────── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
                    <StatCard icon={BookOpen} label="Total Articles" value={stats.total} color="text-cosmic-400" />
                    <StatCard icon={Zap} label="AI Analyzed" value={stats.withAnalysis} color="text-amber-400" />
                    <StatCard icon={TrendingUp} label="Avg Sentiment" value={stats.avgSentiment > 0.1 ? '📈 Positive' : stats.avgSentiment < -0.1 ? '📉 Negative' : '➡️ Neutral'} color="text-green-400" />
                    <StatCard icon={Layers} label="Top Source" value={stats.topSource} color="text-nebula-400" />
                </div>
            )}

            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="cosmic-card glass-dark space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cosmic-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search articles, topics, technologies..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cosmic-500/50 text-white placeholder-gray-500 transition-all font-medium"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDateFilters(!showDateFilters)}
                            className={`px-4 py-2.5 border rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${showDateFilters ? 'bg-cosmic-500/20 border-cosmic-500/40 text-cosmic-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                            <Calendar className="w-4 h-4" />
                            Dates
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2.5 bg-green-500/15 border border-green-500/30 rounded-xl text-green-300 text-sm font-bold flex items-center gap-2 hover:bg-green-500/25 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>
                    </div>
                </div>

                {/* Source & Category pills */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mr-1">Source:</span>
                        {sources.map(s => (
                            <CategoryPill key={s} label={s} active={source === s} onClick={() => { setSource(s); setPage(1) }} />
                        ))}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mr-1">Category:</span>
                        {categories.map(c => (
                            <CategoryPill key={c} label={c} active={category === c} onClick={() => { setCategory(c); setPage(1) }} />
                        ))}
                    </div>
                </div>

                {/* Date filters */}
                {showDateFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Start Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cosmic-500/50"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">End Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cosmic-500/50"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Content ──────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <ArticleSkeleton key={i} />)}
                </div>
            ) : data?.items?.length === 0 ? (
                <NoArticles onReset={() => { setSearch(''); setCategory('All'); setSource('All'); setStartDate(''); setEndDate('') }} />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                        {/* Featured article */}
                        {featured && (
                            <FeaturedArticle
                                article={featured}
                                isFav={isFavorite('article', featured.id)}
                                onToggleFav={() => {
                                    toggleFavorite('article', featured.id)
                                    showToast(isFavorite('article', featured.id) ? 'Removed from favorites' : 'Added to favorites', 'success')
                                }}
                            />
                        )}

                        {/* Regular articles */}
                        {restArticles?.map((article) => (
                            <article
                                key={article.id}
                                className="cosmic-card !p-0 flex flex-col group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cosmic-500/5 blur-3xl rounded-full pointer-events-none" />

                                {article.image_url ? (
                                    <div className="relative h-44 overflow-hidden">
                                        <img
                                            src={article.image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800' }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-70" />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-0.5 bg-space-950/70 backdrop-blur-md rounded-full text-[9px] font-bold text-cosmic-300 uppercase tracking-wider border border-white/10">
                                                {article.source}
                                            </span>
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    toggleFavorite('article', article.id)
                                                    showToast(isFavorite('article', article.id) ? 'Removed from favorites' : 'Added to favorites', 'success')
                                                }}
                                                className={`p-1.5 rounded-full backdrop-blur-md border transition-colors ${isFavorite('article', article.id)
                                                    ? 'text-red-400 bg-red-500/30 border-red-500/30'
                                                    : 'text-white/60 bg-space-950/40 border-white/10 hover:text-red-400'
                                                    }`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${isFavorite('article', article.id) ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-3" />
                                )}

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-cosmic-400 bg-cosmic-500/10 px-2 py-0.5 rounded border border-cosmic-500/20">
                                            {article.category || 'Technology'}
                                        </span>
                                        <span className="text-[10px] text-gray-500">
                                            {article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                                        </span>
                                        <SentimentDot score={article.sentiment_score} />
                                    </div>

                                    <h2 className="text-base font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-cosmic-400 transition-colors">
                                        {article.title}
                                    </h2>

                                    <p className="text-[12px] text-gray-400 line-clamp-3 mb-4 leading-relaxed flex-1">
                                        {article.summary}
                                    </p>

                                    {/* AI Analysis */}
                                    <div className="mb-3">
                                        <ArticleAnalysis technicalAnalysis={article.technical_analysis} sentimentScore={article.sentiment_score} compact={true} />
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="flex flex-wrap gap-1">
                                            {article.tags?.slice(0, 2).map((tag: string) => (
                                                <span key={tag} className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] text-gray-500 font-bold">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        <a
                                            href={article.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[11px] font-bold text-cosmic-400 hover:text-cosmic-300 transition-colors group/link"
                                        >
                                            Read
                                            <ArrowUpRight className="w-3 h-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                                        </a>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* ── Pagination ────────────────────────────────────── */}
                    {data && data.pages > 1 && (
                        <div className="flex justify-center items-center gap-4 py-8 border-t border-white/5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!data.has_prev}
                                className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                            >
                                ← Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                                    const pageNum = i + 1
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pageNum === data.page
                                                ? 'bg-cosmic-500/30 text-cosmic-300 border border-cosmic-500/40'
                                                : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                                {data.pages > 7 && <span className="text-gray-500 px-1">...</span>}
                            </div>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!data.has_next}
                                className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
