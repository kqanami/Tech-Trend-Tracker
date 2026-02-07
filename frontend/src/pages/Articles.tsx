import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { articlesAPI } from '../api/client'
import { Search, Filter, ExternalLink, Calendar, User, Tag } from 'lucide-react'

export default function Articles() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [source, setSource] = useState('')
    const [category, setCategory] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['articles', page, search, source, category],
        queryFn: async () => {
            const response = await articlesAPI.getAll({
                page,
                page_size: 12,
                search: search || undefined,
                source: source || undefined,
                category: category || undefined,
            })
            return response.data
        },
    })

    const { data: sources } = useQuery({
        queryKey: ['article-sources'],
        queryFn: async () => {
            const response = await articlesAPI.getSources()
            return response.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ['article-categories'],
        queryFn: async () => {
            const response = await articlesAPI.getCategories()
            return response.data
        },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold gradient-text">Tech Articles</h1>
                <p className="text-gray-400">Latest technology news from across the web</p>
            </div>

            {/* Filters */}
            <div className="cosmic-card">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 text-white placeholder-gray-500"
                        />
                    </div>

                    {/* Source Filter */}
                    <select
                        value={source}
                        onChange={(e) => {
                            setSource(e.target.value)
                            setPage(1)
                        }}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 text-white"
                    >
                        <option value="">All Sources</option>
                        {sources?.map((s) => (
                            <option key={s} value={s} className="bg-space-900">
                                {s}
                            </option>
                        ))}
                    </select>

                    {/* Category Filter */}
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value)
                            setPage(1)
                        }}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 text-white"
                    >
                        <option value="">All Categories</option>
                        {categories?.map((c) => (
                            <option key={c} value={c} className="bg-space-900">
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-cosmic-500 border-t-transparent rounded-full spinner" />
                </div>
            )}

            {/* Articles Grid */}
            {!isLoading && data && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.items.map((article) => (
                            <article
                                key={article.id}
                                className="cosmic-card group cursor-pointer h-full flex flex-col"
                            >
                                {/* Image */}
                                {article.image_url && (
                                    <div className="aspect-video rounded-lg overflow-hidden mb-4">
                                        <img
                                            src={article.image_url}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 flex flex-col">
                                    {/* Category & Source */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {article.category && (
                                            <span className="text-xs bg-cosmic-500/20 text-cosmic-300 px-2 py-1 rounded-full">
                                                {article.category}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500">{article.source}</span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-bold text-white group-hover:text-cosmic-300 transition-colors mb-2 line-clamp-2">
                                        {article.title}
                                    </h3>

                                    {/* Summary */}
                                    {article.summary && (
                                        <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1">
                                            {article.summary}
                                        </p>
                                    )}

                                    {/* Meta */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
                                        <div className="flex items-center gap-4">
                                            {article.author && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {article.author}
                                                </span>
                                            )}
                                            {article.published_at && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(article.published_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cosmic-400 hover:text-cosmic-300 flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>

                                    {/* Tags */}
                                    {article.tags && article.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {article.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Sentiment */}
                                    {article.sentiment_score !== undefined && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Sentiment:</span>
                                            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${article.sentiment_score > 0
                                                            ? 'bg-green-500'
                                                            : article.sentiment_score < 0
                                                                ? 'bg-red-500'
                                                                : 'bg-gray-500'
                                                        }`}
                                                    style={{
                                                        width: `${Math.abs(article.sentiment_score) * 50 + 50}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Pagination */}
                    {data.pages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={!data.has_prev}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-gray-400">
                                Page {data.page} of {data.pages}
                            </span>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={!data.has_next}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Empty State */}
            {!isLoading && data && data.items.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400">No articles found</p>
                </div>
            )}
        </div>
    )
}
