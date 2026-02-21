import { useQuery } from '@tanstack/react-query'
import { articlesAPI, trendsAPI, repositoriesAPI } from '../api/client'
import { useFavorites } from '../hooks/useFavorites'
import { Heart, ExternalLink, TrendingUp, Newspaper, Github, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useState } from 'react'

export default function Favorites() {
    const { favorites, getFavoritesByType, removeFavorite } = useFavorites()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'trends' | 'repos'>('all')

    const articleIds = getFavoritesByType('article')
    const trendIds = getFavoritesByType('trend')
    const repoIds = getFavoritesByType('repo')

    const { data: articles } = useQuery({
        queryKey: ['favorite-articles', articleIds],
        queryFn: async () => {
            if (articleIds.length === 0) return []
            const results = await Promise.all(
                articleIds.map((id) => articlesAPI.getById(id).catch(() => null))
            )
            return results.filter((a) => a !== null).map((r) => r!.data)
        },
        enabled: articleIds.length > 0 && (activeTab === 'all' || activeTab === 'articles'),
    })

    const { data: trends } = useQuery({
        queryKey: ['favorite-trends', trendIds],
        queryFn: async () => {
            if (trendIds.length === 0) return []
            const results = await Promise.all(
                trendIds.map((id) => trendsAPI.getById(id).catch(() => null))
            )
            return results.filter((t) => t !== null).map((r) => r!.data)
        },
        enabled: trendIds.length > 0 && (activeTab === 'all' || activeTab === 'trends'),
    })

    const { data: repos } = useQuery({
        queryKey: ['favorite-repos', repoIds],
        queryFn: async () => {
            if (repoIds.length === 0) return []
            const results = await Promise.all(
                repoIds.map((id) => repositoriesAPI.getById(id).catch(() => null))
            )
            return results.filter((r) => r !== null).map((r) => r!.data)
        },
        enabled: repoIds.length > 0 && (activeTab === 'all' || activeTab === 'repos'),
    })

    const totalFavorites = favorites.length

    if (totalFavorites === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="text-center py-20">
                    <Heart className="w-16 h-16 mx-auto text-gray-600 mb-4 opacity-20" />
                    <h2 className="text-2xl font-bold text-white mb-2">No Favorites Yet</h2>
                    <p className="text-gray-400">Start adding items to your favorites by clicking the heart icon!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <Heart className="w-12 h-12 text-red-500 fill-red-500" />
                    My Favorites
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto">
                    Your saved articles, trends, and repositories in one place.
                </p>
            </div>

            {/* Tabs */}
            <div className="cosmic-card">
                <div className="flex gap-2">
                    {[
                        { id: 'all', label: 'All', count: totalFavorites },
                        { id: 'articles', label: 'Articles', count: articleIds.length },
                        { id: 'trends', label: 'Trends', count: trendIds.length },
                        { id: 'repos', label: 'Repos', count: repoIds.length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Articles */}
            {(activeTab === 'all' || activeTab === 'articles') && articles && articles.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-cosmic-400" />
                        Articles ({articles.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map((article) => (
                            <div key={article.id} className="cosmic-card group">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-cosmic-300 transition-colors line-clamp-2 flex-1">
                                        {article.title}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            removeFavorite('article', article.id)
                                            showToast('Removed from favorites', 'success')
                                        }}
                                        className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{article.summary}</p>
                                <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-cosmic-400 hover:text-cosmic-300 transition-colors"
                                >
                                    Read More
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trends */}
            {(activeTab === 'all' || activeTab === 'trends') && trends && trends.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-purple-400" />
                        Trends ({trends.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trends.map((trend) => (
                            <div key={trend.id} className="cosmic-card group">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors flex-1">
                                        {trend.name}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            removeFavorite('trend', trend.id)
                                            showToast('Removed from favorites', 'success')
                                        }}
                                        className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-purple-gradient"
                                        style={{ width: `${trend.overall_score}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{trend.mention_count} mentions</span>
                                    <span className="text-purple-400">{trend.overall_score.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Repos */}
            {(activeTab === 'all' || activeTab === 'repos') && repos && repos.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Github className="w-6 h-6 text-blue-400" />
                        Repositories ({repos.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {repos.map((repo) => (
                            <div key={repo.id} className="cosmic-card group">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors flex-1">
                                        {repo.name}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            removeFavorite('repo', repo.id)
                                            showToast('Removed from favorites', 'success')
                                        }}
                                        className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-4">{repo.description}</p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">{repo.language}</span>
                                    <span className="text-blue-400">{repo.stars} stars</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

