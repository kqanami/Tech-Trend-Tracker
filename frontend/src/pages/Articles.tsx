import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { articlesAPI } from '../api/client'
import { Search, Filter, ExternalLink, Tag, Calendar, Heart, Download } from 'lucide-react'
import SimilarArticles from '../components/SimilarArticles'
import ArticleAnalysis from '../components/ArticleAnalysis'
import { useFavorites } from '../hooks/useFavorites'
import { useToast } from '../components/Toast'
import { ArticleSkeleton } from '../components/SkeletonLoader'
import { exportAPI } from '../api/client'

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
            })
            return response.data
        },
        refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    })

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
        } catch (error) {
            showToast('Failed to export articles', 'error')
        }
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="relative text-center py-6">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight">Intelligence Feed</h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto">Decrypting the latest signals from the technology frontline with deep-space precision.</p>
            </div>

            {/* Filters and Search */}
            <div className="cosmic-card glass-dark sticky top-4 z-20">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-cosmic-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search data streams..."
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cosmic-500/50 focus:border-cosmic-500/50 text-white placeholder-gray-500 transition-all font-medium"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1)
                                }}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="relative group min-w-[160px]">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                <select
                                    className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cosmic-500/50 text-white appearance-none transition-all font-medium cursor-pointer"
                                    value={category}
                                    onChange={(e) => {
                                        setCategory(e.target.value)
                                        setPage(1)
                                    }}
                                >
                                    <option value="All">All Sectors</option>
                                    <option value="AI">AI Sphere</option>
                                    <option value="Web">Web Mesh</option>
                                    <option value="Mobile">Mobile Core</option>
                                    <option value="Crypto">Crypto Grid</option>
                                </select>
                            </div>
                            <div className="relative group min-w-[160px]">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                <select
                                    className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cosmic-500/50 text-white appearance-none transition-all font-medium cursor-pointer"
                                    value={source}
                                    onChange={(e) => {
                                        setSource(e.target.value)
                                        setPage(1)
                                    }}
                                >
                                    <option value="All">All Channels</option>
                                    <option value="TechCrunch">TechCrunch</option>
                                    <option value="HackerNews">HackerNews</option>
                                    <option value="ArXiv">ArXiv</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setShowDateFilters(!showDateFilters)}
                                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-medium text-white flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Dates
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-4 py-3 bg-green-500/20 border border-green-500/50 rounded-xl hover:bg-green-500/30 transition-all font-medium text-green-300 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Date Filters */}
                    {showDateFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cosmic-500/50"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value)
                                        setPage(1)
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cosmic-500/50"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value)
                                        setPage(1)
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <ArticleSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {data?.items.map((article) => (
                            <article
                                key={article.id}
                                className="cosmic-card min-h-[580px] flex flex-col group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cosmic-500/5 blur-3xl rounded-full" />

                                {article.image_url ? (
                                    <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden">
                                        <img
                                            src={article.image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent opacity-60" />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-space-950/80 backdrop-blur-md rounded-full text-[10px] font-bold text-cosmic-300 uppercase tracking-wider border border-white/10">
                                                {article.source}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-2" />
                                )}

                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-semibold text-cosmic-400 bg-cosmic-500/10 px-2 py-0.5 rounded border border-cosmic-500/20">
                                            {article.category || 'Technology'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Recent'}
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-cosmic-400 transition-colors">
                                        {article.title}
                                    </h2>

                                    <p className="text-sm text-gray-400 line-clamp-3 mb-6 leading-relaxed flex-1 italic">
                                        {article.summary}
                                    </p>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        {/* AI Analysis Panel */}
                                        <ArticleAnalysis
                                            technicalAnalysis={article.technical_analysis}
                                            sentimentScore={article.sentiment_score}
                                            compact={true}
                                        />

                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-wrap gap-1">
                                                {article.tags?.slice(0, 2).map((tag) => (
                                                    <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] text-gray-500 font-bold hover:text-white transition-colors">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        toggleFavorite('article', article.id)
                                                        showToast(
                                                            isFavorite('article', article.id)
                                                                ? 'Removed from favorites'
                                                                : 'Added to favorites',
                                                            'success'
                                                        )
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-colors ${isFavorite('article', article.id)
                                                            ? 'text-red-400 bg-red-500/20'
                                                            : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                                        }`}
                                                >
                                                    <Heart className={`w-4 h-4 ${isFavorite('article', article.id) ? 'fill-current' : ''}`} />
                                                </button>
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs font-bold text-cosmic-400 hover:text-cosmic-300 transition-colors group/link"
                                                >
                                                    Open Signal
                                                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                                                </a>
                                            </div>
                                        </div>

                                        <SimilarArticles articleId={article.id} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Pagination */}
                    {data && data.pages > 1 && (
                        <div className="flex justify-center items-center gap-6 mt-12 py-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!data.has_prev}
                                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Orbit</span>
                                <span className="text-cosmic-400 font-black text-lg">{data.page}</span>
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">of {data.pages}</span>
                            </div>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!data.has_next}
                                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
