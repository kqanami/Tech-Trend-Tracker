import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { statisticsAPI } from '../api/client'
import { BarChart3, TrendingUp, Calendar, Download, Activity } from 'lucide-react'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts'
import { format } from 'date-fns'

export default function Statistics() {
    const [days, setDays] = useState(30)
    const [period1Days, setPeriod1Days] = useState(7)
    const [period2Days, setPeriod2Days] = useState(7)

    const { data: sources } = useQuery({
        queryKey: ['sources-performance', days],
        queryFn: async () => {
            const response = await statisticsAPI.getSourcesPerformance(days)
            return response.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ['categories-trending', days],
        queryFn: async () => {
            const response = await statisticsAPI.getCategoriesTrending(days)
            return response.data
        },
    })

    const { data: timeSeries } = useQuery({
        queryKey: ['time-series', days],
        queryFn: async () => {
            const response = await statisticsAPI.getTimeSeries('articles', days, 'day')
            return response.data
        },
    })

    const { data: comparison } = useQuery({
        queryKey: ['period-comparison', period1Days, period2Days],
        queryFn: async () => {
            const response = await statisticsAPI.comparePeriods(period1Days, period2Days)
            return response.data
        },
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <BarChart3 className="w-12 h-12 text-purple-500" />
                    Advanced Statistics
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto">
                    Deep insights into technology trends, sources performance, and temporal patterns.
                </p>
            </div>

            {/* Time Period Selector */}
            <div className="cosmic-card">
                <div className="flex items-center gap-4 mb-4">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Time Period</h3>
                </div>
                <select
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={60}>Last 60 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {/* Sources Performance */}
            {sources && (
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-3 text-blue-400" />
                        Sources Performance
                    </h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sources.sources}>
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
                                <Bar dataKey="total_articles" fill="#818cf8" name="Articles" />
                                <Bar dataKey="avg_sentiment" fill="#d946ef" name="Avg Sentiment" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Trending Categories */}
            {categories && (
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-3 text-green-400" />
                        Trending Categories
                    </h3>
                    <div className="space-y-3">
                        {categories.trending_categories.slice(0, 10).map((cat, index) => (
                            <div key={cat.category} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-white/10 w-8">#{index + 1}</span>
                                    <div>
                                        <h4 className="font-bold text-white">{cat.category}</h4>
                                        <p className="text-sm text-gray-400">
                                            {cat.count} articles ({cat.previous_count} previous)
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-black ${cat.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {cat.growth > 0 ? '+' : ''}{cat.growth.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-gray-500">Growth</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Time Series */}
            {timeSeries && (
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Calendar className="w-5 h-5 mr-3 text-purple-400" />
                        Articles Over Time
                    </h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeSeries.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickFormatter={(value) => {
                                        try {
                                            return format(new Date(value), 'MMM dd')
                                        } catch {
                                            return value
                                        }
                                    }}
                                />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 15, 30, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                    }}
                                    labelFormatter={(value) => {
                                        try {
                                            return format(new Date(value), 'MMM dd, yyyy')
                                        } catch {
                                            return value
                                        }
                                    }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Period Comparison */}
            {comparison && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="cosmic-card">
                        <h3 className="text-xl font-bold text-white mb-4">Period 1</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Articles</span>
                                <span className="font-bold text-white">{comparison.period1.articles}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Repos</span>
                                <span className="font-bold text-white">{comparison.period1.repos}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                {comparison.period1.start ? format(new Date(comparison.period1.start), 'MMM dd') : ''} - {comparison.period1.end ? format(new Date(comparison.period1.end), 'MMM dd') : ''}
                            </div>
                        </div>
                    </div>

                    <div className="cosmic-card">
                        <h3 className="text-xl font-bold text-white mb-4">Period 2</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Articles</span>
                                <span className="font-bold text-white">{comparison.period2.articles}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Repos</span>
                                <span className="font-bold text-white">{comparison.period2.repos}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                {comparison.period2.start ? format(new Date(comparison.period2.start), 'MMM dd') : ''} - {comparison.period2.end ? format(new Date(comparison.period2.end), 'MMM dd') : ''}
                            </div>
                        </div>
                    </div>

                    <div className="cosmic-card lg:col-span-2">
                        <h3 className="text-xl font-bold text-white mb-4">Changes</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="text-sm text-gray-400 mb-2">Articles</div>
                                <div className={`text-2xl font-black ${comparison.changes.articles.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {comparison.changes.articles.percentage > 0 ? '+' : ''}{comparison.changes.articles.percentage.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {comparison.changes.articles.absolute > 0 ? '+' : ''}{comparison.changes.articles.absolute} articles
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg">
                                <div className="text-sm text-gray-400 mb-2">Repos</div>
                                <div className={`text-2xl font-black ${comparison.changes.repos.percentage > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {comparison.changes.repos.percentage > 0 ? '+' : ''}{comparison.changes.repos.percentage.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {comparison.changes.repos.absolute > 0 ? '+' : ''}{comparison.changes.repos.absolute} repos
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

