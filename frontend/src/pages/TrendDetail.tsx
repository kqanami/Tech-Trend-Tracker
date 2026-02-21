import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../api/client'
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Sparkles, BarChart3, Link2, ExternalLink } from 'lucide-react'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area,
} from 'recharts'
import { format } from 'date-fns'

export default function TrendDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const trendId = parseInt(id || '0')

    const { data: insights, isLoading } = useQuery({
        queryKey: ['trend-insights', trendId],
        queryFn: async () => {
            const response = await analyticsAPI.getTrendInsights(trendId)
            return response.data
        },
        enabled: !!trendId,
    })

    const { data: history } = useQuery({
        queryKey: ['trend-history', trendId],
        queryFn: async () => {
            const response = await analyticsAPI.getTrendHistory(trendId, 30)
            return response.data
        },
        enabled: !!trendId,
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-16 h-16 border-4 border-cosmic-500/30 border-t-cosmic-500 rounded-full animate-spin" />
                <p className="text-cosmic-400 font-bold animate-pulse">Analyzing trend trajectory...</p>
            </div>
        )
    }

    if (!insights) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Trend not found</p>
                <button
                    onClick={() => navigate('/trends')}
                    className="mt-4 px-6 py-2 bg-cosmic-500/20 border border-cosmic-500/50 rounded-xl text-cosmic-400 hover:bg-cosmic-500/30 transition-all"
                >
                    Back to Trends
                </button>
            </div>
        )
    }

    const chartData = history?.history.map((h) => ({
        date: format(new Date(h.recorded_at), 'MMM dd'),
        score: h.overall_score,
        popularity: h.popularity_score,
        growth: h.growth_score,
        mentions: h.mention_count,
    })) || []

    const prediction = insights.prediction
    const DirectionIcon = prediction.direction === 'up' ? TrendingUp : prediction.direction === 'down' ? TrendingDown : Activity
    const directionColor = prediction.direction === 'up' ? 'text-green-400' : prediction.direction === 'down' ? 'text-red-400' : 'text-gray-400'

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/trends')}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-extrabold gradient-text">{insights.trend.name}</h1>
                    <p className="text-gray-400 mt-2">{insights.trend.category}</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="cosmic-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Current Score</span>
                        <BarChart3 className="w-4 h-4 text-cosmic-400" />
                    </div>
                    <p className="text-3xl font-black text-white">{insights.trend.overall_score.toFixed(1)}</p>
                    <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cosmic-gradient"
                            style={{ width: `${insights.trend.overall_score}%` }}
                        />
                    </div>
                </div>

                <div className="cosmic-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Predicted</span>
                        <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-3xl font-black text-white">{prediction.predicted_score.toFixed(1)}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <DirectionIcon className={`w-4 h-4 ${directionColor}`} />
                        <span className={`text-xs font-bold ${directionColor}`}>
                            {prediction.direction.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="cosmic-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Momentum</span>
                        <Activity className="w-4 h-4 text-nebula-400" />
                    </div>
                    <p className="text-3xl font-black text-white">{insights.momentum.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Rate of change</p>
                </div>

                <div className="cosmic-card">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Mentions</span>
                        <Link2 className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-3xl font-black text-white">{insights.trend.mention_count}</p>
                    <p className="text-xs text-gray-500 mt-2">
                        {insights.trend.article_count} articles, {insights.trend.repo_count} repos
                    </p>
                </div>
            </div>

            {/* History Chart */}
            {chartData.length > 0 && (
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-3 text-cosmic-400" />
                        Trend History (30 days)
                    </h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 15, 30, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#818cf8"
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                />
                                <Line type="monotone" dataKey="popularity" stroke="#d946ef" strokeWidth={2} />
                                <Line type="monotone" dataKey="growth" stroke="#f59e0b" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Prediction Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Sparkles className="w-5 h-5 mr-3 text-purple-400" />
                        Prediction Analysis
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-sm text-gray-400">Confidence</span>
                            <span className="text-lg font-bold text-white">{(prediction.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-sm text-gray-400">Growth Rate</span>
                            <span className="text-lg font-bold text-white">{prediction.growth_rate.toFixed(3)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-sm text-gray-400">Days Ahead</span>
                            <span className="text-lg font-bold text-white">{prediction.days_ahead}</span>
                        </div>
                    </div>
                </div>

                {/* Related Trends */}
                {insights.related_trends.length > 0 && (
                    <div className="cosmic-card">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <Link2 className="w-5 h-5 mr-3 text-blue-400" />
                            Related Trends
                        </h3>
                        <div className="space-y-3">
                            {insights.related_trends.map((trend) => (
                                <div
                                    key={trend.id}
                                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/trends/${trend.id}`)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white">{trend.name}</span>
                                        <span className="text-sm text-cosmic-400">{trend.overall_score.toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Top Articles */}
            {insights.top_articles.length > 0 && (
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <ExternalLink className="w-5 h-5 mr-3 text-cosmic-400" />
                        Top Articles
                    </h3>
                    <div className="space-y-3">
                        {insights.top_articles.map((article) => (
                            <a
                                key={article.id}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <h4 className="font-bold text-white mb-1">{article.title}</h4>
                                <p className="text-sm text-gray-400 line-clamp-2">{article.summary}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

