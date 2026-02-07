import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trendsAPI } from '../api/client'
import { TrendingUp, Search, BarChart3, Activity } from 'lucide-react'
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts'

export default function Trends() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('')

    const { data, isLoading } = useQuery({
        queryKey: ['trends', page, search, category],
        queryFn: async () => {
            const response = await trendsAPI.getAll({
                page,
                page_size: 20,
                search: search || undefined,
                category: category || undefined,
            })
            return response.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ['trend-categories'],
        queryFn: async () => {
            const response = await trendsAPI.getCategories()
            return response.data
        },
    })

    // Prepare data for radar chart (top 6 trends)
    const radarData = data?.items.slice(0, 6).map((trend) => ({
        name: trend.name.length > 12 ? trend.name.substring(0, 12) + '...' : trend.name,
        popularity: trend.popularity_score,
        growth: trend.growth_score,
        overall: trend.overall_score,
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold gradient-text">Technology Trends</h1>
                <p className="text-gray-400">Discover what's hot in tech right now</p>
            </div>

            {/* Filters */}
            <div className="cosmic-card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search trends..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cosmic-500 text-white placeholder-gray-500"
                        />
                    </div>

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
                        {categories?.map((cat) => (
                            <option key={cat} value={cat} className="bg-space-900">
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Radar Chart */}
            {!isLoading && radarData && radarData.length > 0 && (
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-cosmic-400" />
                        Top Trends Comparison
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="name" stroke="#9ca3af" />
                            <PolarRadiusAxis stroke="#9ca3af" />
                            <Radar
                                name="Popularity"
                                dataKey="popularity"
                                stroke="#6366f1"
                                fill="#6366f1"
                                fillOpacity={0.3}
                            />
                            <Radar
                                name="Growth"
                                dataKey="growth"
                                stroke="#d946ef"
                                fill="#d946ef"
                                fillOpacity={0.3}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-cosmic-500 border-t-transparent rounded-full spinner" />
                </div>
            )}

            {/* Trends List */}
            {!isLoading && data && (
                <>
                    <div className="space-y-4">
                        {data.items.map((trend, index) => (
                            <div
                                key={trend.id}
                                className="cosmic-card group cursor-pointer"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Rank */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${index < 3
                                                ? 'bg-cosmic-gradient text-white shadow-cosmic'
                                                : 'bg-white/5 text-gray-400'
                                            }`}>
                                            #{(page - 1) * 20 + index + 1}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-white group-hover:text-cosmic-300 transition-colors">
                                                    {trend.name}
                                                </h3>
                                                <span className="text-sm text-gray-400">{trend.category}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-cosmic-400">
                                                    {trend.overall_score.toFixed(1)}
                                                </div>
                                                <div className="text-xs text-gray-500">Overall Score</div>
                                            </div>
                                        </div>

                                        {trend.description && (
                                            <p className="text-sm text-gray-400 mb-4">{trend.description}</p>
                                        )}

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">Mentions</div>
                                                <div className="text-lg font-semibold text-white">
                                                    {trend.mention_count}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">Articles</div>
                                                <div className="text-lg font-semibold text-white">
                                                    {trend.article_count}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">Repos</div>
                                                <div className="text-lg font-semibold text-white">
                                                    {trend.repo_count}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 mb-1">
                                                    <Activity className="w-3 h-3 inline mr-1" />
                                                    Updated
                                                </div>
                                                <div className="text-xs font-medium text-white">
                                                    {new Date(trend.calculated_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Bars */}
                                        <div className="space-y-2">
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Popularity</span>
                                                    <span>{trend.popularity_score.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-cosmic-gradient"
                                                        style={{ width: `${trend.popularity_score}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Growth</span>
                                                    <span>{trend.growth_score.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-nebula-gradient"
                                                        style={{ width: `${trend.growth_score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                    <p className="text-gray-400">No trends found</p>
                </div>
            )}
        </div>
    )
}
