import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../api/client'
import { TrendingUp, Activity, Calendar, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'

export default function EmergingTrends() {
    const navigate = useNavigate()
    const [days, setDays] = useState(7)
    const [minGrowth, setMinGrowth] = useState(10)

    const { data: emerging, isLoading } = useQuery({
        queryKey: ['emerging-trends', days, minGrowth],
        queryFn: async () => {
            const response = await analyticsAPI.getEmergingTrends(days, minGrowth, 20)
            return response.data
        },
    })

    const chartData = emerging?.trends.map((trend) => ({
        name: trend.name.length > 15 ? trend.name.substring(0, 12) + '...' : trend.name,
        fullName: trend.name,
        growth_rate: trend.growth_rate,
        current_score: trend.current_score,
        score_change: trend.score_change,
    })) || []

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <TrendingUp className="w-12 h-12 text-green-500" />
                    Emerging Trends
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto">
                    Discover the fastest-growing technologies. These trends are gaining momentum right now.
                </p>
            </div>

            {/* Filters */}
            <div className="cosmic-card">
                <div className="flex items-center gap-4 mb-4">
                    <Filter className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Time Window (days)</label>
                        <select
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                        >
                            <option value={7}>7 days</option>
                            <option value={14}>14 days</option>
                            <option value={30}>30 days</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Minimum Growth (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            value={minGrowth}
                            onChange={(e) => setMinGrowth(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
            ) : emerging && emerging.trends.length > 0 ? (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="cosmic-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-5 h-5 text-green-400" />
                                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                    Emerging Trends
                                </span>
                            </div>
                            <p className="text-3xl font-black text-white">{emerging.trends.length}</p>
                        </div>
                        <div className="cosmic-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                    Time Window
                                </span>
                            </div>
                            <p className="text-3xl font-black text-white">{days} days</p>
                        </div>
                        <div className="cosmic-card">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                                    Avg Growth
                                </span>
                            </div>
                            <p className="text-3xl font-black text-white">
                                {(
                                    emerging.trends.reduce((sum, t) => sum + t.growth_rate, 0) /
                                    emerging.trends.length
                                ).toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="cosmic-card">
                        <h3 className="text-xl font-bold text-white mb-6">Growth Rate Comparison</h3>
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
                                    <Bar dataKey="growth_rate" fill="#10b981" name="Growth Rate (%)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Trends List */}
                    <div className="space-y-4">
                        {emerging.trends.map((trend, index) => (
                            <div
                                key={trend.trend_id}
                                className="cosmic-card group cursor-pointer hover:scale-[1.01] transition-transform"
                                onClick={() => navigate(`/trends/${trend.trend_id}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="text-3xl font-black text-white/10 group-hover:text-green-500/20 transition-colors w-12">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
                                                {trend.name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                                                    {trend.category}
                                                </span>
                                                <span className="text-gray-400">Score: {trend.current_score.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-green-400 mb-1">
                                            +{trend.growth_rate.toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {trend.score_change > 0 ? '+' : ''}{trend.score_change.toFixed(1)} points
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-gray-400">
                    <p>No emerging trends found with the current filters.</p>
                    <p className="text-sm mt-2">Try adjusting the minimum growth threshold.</p>
                </div>
            )}
        </div>
    )
}

