import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { repositoriesAPI } from '../api/client'
import { Search, Star, GitFork, Eye, Code, ExternalLink } from 'lucide-react'

export default function Repositories() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [language, setLanguage] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['repositories', page, search, language],
        queryFn: async () => {
            const response = await repositoriesAPI.getAll({
                page,
                page_size: 12,
                search: search || undefined,
                language: language || undefined,
            })
            return response.data
        },
    })

    const { data: languages } = useQuery({
        queryKey: ['repo-languages'],
        queryFn: async () => {
            const response = await repositoriesAPI.getLanguages()
            return response.data
        },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold gradient-text">GitHub Repositories</h1>
                <p className="text-gray-400">Trending open-source projects</p>
            </div>

            {/* Filters */}
            <div className="cosmic-card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search repositories..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 text-white placeholder-gray-500"
                        />
                    </div>

                    {/* Language Filter */}
                    <select
                        value={language}
                        onChange={(e) => {
                            setLanguage(e.target.value)
                            setPage(1)
                        }}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 text-white"
                    >
                        <option value="">All Languages</option>
                        {languages?.map((lang) => (
                            <option key={lang} value={lang} className="bg-space-900">
                                {lang}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-nebula-500 border-t-transparent rounded-full spinner" />
                </div>
            )}

            {/* Repositories Grid */}
            {!isLoading && data && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {data.items.map((repo) => (
                            <div
                                key={repo.id}
                                className="cosmic-card group cursor-pointer"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white group-hover:text-nebula-300 transition-colors mb-1">
                                            {repo.name}
                                        </h3>
                                        <p className="text-sm text-gray-400">{repo.owner}</p>
                                    </div>
                                    <a
                                        href={repo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-nebula-400 hover:text-nebula-300 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                </div>

                                {/* Description */}
                                {repo.description && (
                                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                                        {repo.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400" />
                                        <span>{repo.stars.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <GitFork className="w-4 h-4" />
                                        <span>{repo.forks.toLocaleString()}</span>
                                    </div>
                                    {repo.language && (
                                        <div className="flex items-center gap-1">
                                            <Code className="w-4 h-4" />
                                            <span>{repo.language}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Topics */}
                                {repo.topics && repo.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {JSON.parse(repo.topics).slice(0, 5).map((topic: string) => (
                                            <span
                                                key={topic}
                                                className="text-xs bg-nebula-500/10 text-nebula-300 px-2 py-1 rounded-full"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Trending Score */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Trending Score</span>
                                    <span className="text-sm font-bold text-nebula-400">
                                        {repo.trending_score.toFixed(1)}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-nebula-gradient"
                                        style={{ width: `${Math.min(repo.trending_score, 100)}%` }}
                                    />
                                </div>

                                {/* Stars Today */}
                                {repo.stars_today && repo.stars_today > 0 && (
                                    <div className="mt-3 text-xs text-green-400 flex items-center gap-1">
                                        <Star className="w-3 h-3" />
                                        +{repo.stars_today} stars today
                                    </div>
                                )}
                            </div>
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
                    <p className="text-gray-400">No repositories found</p>
                </div>
            )}
        </div>
    )
}
