import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI, trendsAPI } from '../api/client'
import { BarChart3, TrendingUp, Activity, X, Plus } from 'lucide-react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts'

export default function TrendCompare() {
    const [selectedTrends, setSelectedTrends] = useState<number[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const { data: allTrends } = useQuery({
        queryKey: ['trends-for-compare'],
        queryFn: async () => {
            const response = await trendsAPI.getAll({ page_size: 100 })
            return response.data.items
        },
    })

    const { data: comparison, isLoading } = useQuery({
        queryKey: ['trend-comparison', selectedTrends],
        queryFn: async () => {
            const response = await analyticsAPI.compareTrends(selectedTrends)
            return response.data
        },
        enabled: selectedTrends.length >= 2,
    })

    const filteredTrends = allTrends?.filter((trend) =>
        trend.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    const addTrend = (trendId: number) => {
        if (selectedTrends.length < 10 && !selectedTrends.includes(trendId)) {
            setSelectedTrends([...selectedTrends, trendId])
        }
    }

    const removeTrend = (trendId: number) => {
        setSelectedTrends(selectedTrends.filter((id) => id !== trendId))
    }

    const chartData = comparison?.trends.map((trend) => ({
        name: trend.name.length > 15 ? trend.name.substring(0, 12) + '...' : trend.name,
        fullName: trend.name,
        overall_score: trend.overall_score,
        popularity_score: trend.popularity_score,
        growth_score: trend.growth_score,
        mention_count: trend.mention_count,
        growth_rate: (trend as any).growth_rate || 0,
    })) || []

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <BarChart3 className="w-12 h-12 text-purple-500" />
                    Technology Comparison
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto">
                    Compare up to 10 technologies side by side. Analyze their performance, growth, and popularity.
                </p>
            </div>

            {/* Trend Selection */}
            <div className="cosmic-card">
                <h3 className="text-xl font-bold text-white mb-4">Select Trends to Compare</h3>
                
                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search trends..."
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Selected Trends */}
                {selectedTrends.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {selectedTrends.map((trendId) => {
                            const trend = allTrends?.find((t) => t.id === trendId)
                            return (
                                <div
                                    key={trendId}
                                    className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg"
                                >
                                    <span className="text-sm font-bold text-white">{trend?.name}</span>
                                    <button
                                        onClick={() => removeTrend(trendId)}
                                        className="hover:bg-purple-500/30 rounded p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3 text-purple-300" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Available Trends */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredTrends
                        .filter((trend) => !selectedTrends.includes(trend.id))
                        .slice(0, 20)
                        .map((trend) => (
                            <button
                                key={trend.id}
                                onClick={() => addTrend(trend.id)}
                                disabled={selectedTrends.length >= 10}
                                className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <Plus className="w-4 h-4 text-purple-400" />
                                    <span className="font-bold text-white">{trend.name}</span>
                                    <span className="text-xs text-gray-500">{trend.category}</span>
                                </div>
                                <span className="text-sm text-purple-400">{trend.overall_score.toFixed(1)}</span>
                            </button>
                        ))}
                </div>
            </div>

            {/* Comparison Results */}
            {isLoading && selectedTrends.length >= 2 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
            ) : comparison && selectedTrends.length >= 2 ? (
                <>
                    {/* Metrics Summary */}
                    {comparison.metrics && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {comparison.metrics.highest_score && (
                                <div className="cosmic-card">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                            Highest Score
                                        </span>
                                    </div>
                                    <p className="text-2xl font-black text-white">{comparison.metrics.highest_score}</p>
                                </div>
                            )}
                            {comparison.metrics.fastest_growing && (
                                <div className="cosmic-card">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-5 h-5 text-blue-400" />
                                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                            Fastest Growing
                                        </span>
                                    </div>
                                    <p className="text-2xl font-black text-white">{comparison.metrics.fastest_growing}</p>
                                </div>
                            )}
                            {comparison.metrics.most_mentioned && (
                                <div className="cosmic-card">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 className="w-5 h-5 text-purple-400" />
                                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                            Most Mentioned
                                        </span>
                                    </div>
                                    <p className="text-2xl font-black text-white">{comparison.metrics.most_mentioned}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Scores Comparison */}
                        <div className="cosmic-card">
                            <h3 className="text-xl font-bold text-white mb-6">Score Comparison</h3>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={80} />
                                        <YAxis stroke="#6b7280" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 15, 30, 0.95)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="overall_score" fill="#818cf8" name="Overall Score" />
                                        <Bar dataKey="popularity_score" fill="#d946ef" name="Popularity" />
                                        <Bar dataKey="growth_score" fill="#f59e0b" name="Growth" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Detailed Metrics */}
                        <div className="cosmic-card">
                            <h3 className="text-xl font-bold text-white mb-6">Detailed Metrics</h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {comparison.trends.map((trend) => (
                                    <div key={trend.id} className="p-4 bg-white/5 rounded-lg">
                                        <h4 className="font-bold text-white mb-3">{trend.name}</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Overall Score</span>
                                                <span className="font-bold text-white">{trend.overall_score.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Popularity</span>
                                                <span className="font-bold text-white">{trend.popularity_score.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Growth</span>
                                                <span className="font-bold text-white">{trend.growth_score.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Mentions</span>
                                                <span className="font-bold text-white">{trend.mention_count}</span>
                                            </div>
                                            {(trend as any).growth_rate !== undefined && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">Growth Rate</span>
                                                    <span className={`font-bold ${(trend as any).growth_rate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {(trend as any).growth_rate > 0 ? '+' : ''}{(trend as any).growth_rate.toFixed(2)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : selectedTrends.length < 2 ? (
                <div className="text-center py-20 text-gray-400">
                    <p>Select at least 2 trends to compare</p>
                </div>
            ) : null}
        </div>
    )
}

