import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../api/client'
import {
    ArrowLeft, TrendingUp, TrendingDown, Activity, Sparkles, BarChart3,
    Link2, ExternalLink, Zap, Eye, MessageSquare, Newspaper, Github,
    Target, ArrowUpRight, ArrowDownRight, Minus, Clock, Layers
} from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Legend,
    BarChart,
    Bar,
    Cell,
} from 'recharts'
import { format } from 'date-fns'

// ── Helpers ───────────────────────────────────────────────────────────────────
const safe = (v: number | null | undefined, d = 1, fb = '0.0') => v != null ? v.toFixed(d) : fb

const CosmicTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-space-950/95 border border-white/10 backdrop-blur-xl rounded-xl p-3 shadow-2xl">
            <p className="text-xs text-gray-400 font-bold mb-1">{label}</p>
            {payload.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                    <span className="text-gray-300">{e.name}:</span>
                    <span className="font-bold text-white">{typeof e.value === 'number' ? e.value.toFixed(1) : e.value}</span>
                </div>
            ))}
        </div>
    )
}

// ── Score Gauge Ring ──────────────────────────────────────────────────────────
function ScoreGauge({ score, size = 140, label, color = '#818cf8' }: { score: number; size?: number; label: string; color?: string }) {
    const radius = (size - 16) / 2
    const circumference = 2 * Math.PI * radius
    const pct = Math.min(score, 100) / 100
    const offset = circumference * (1 - pct)

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
                <span className="text-3xl font-black text-white">{safe(score)}</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold">{label}</span>
            </div>
        </div>
    )
}

// ── Metric Pill ───────────────────────────────────────────────────────────────
function MetricPill({ icon: Icon, label, value, color = 'text-cosmic-400', bgColor = 'bg-cosmic-500/10', borderColor = 'border-cosmic-500/20' }: {
    icon: React.ElementType; label: string; value: string | number; color?: string; bgColor?: string; borderColor?: string
}) {
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bgColor} border ${borderColor}`}>
            <Icon className={`w-5 h-5 ${color} shrink-0`} />
            <div>
                <p className="text-[9px] uppercase tracking-[0.15em] text-gray-500 font-bold">{label}</p>
                <p className="text-lg font-black text-white">{value}</p>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
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
            try {
                const response = await analyticsAPI.getTrendHistory(trendId, 30)
                return response.data
            } catch (error: any) {
                if (error.response?.status === 404) return { history: [] } as any
                throw error
            }
        },
        enabled: !!trendId,
    })

    // ── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-cosmic-500/20 border-t-cosmic-500 rounded-full animate-spin" />
                    <Zap className="w-8 h-8 text-cosmic-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-cosmic-400 font-bold animate-pulse text-sm">Analyzing trend trajectory...</p>
            </div>
        )
    }

    if (!insights) {
        return (
            <div className="text-center py-20">
                <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-lg">Trend not found</p>
                <button
                    onClick={() => navigate('/trends')}
                    className="mt-4 px-6 py-2 bg-cosmic-500/20 border border-cosmic-500/50 rounded-xl text-cosmic-400 hover:bg-cosmic-500/30 transition-all"
                >
                    ← Back to Trends
                </button>
            </div>
        )
    }

    const trend = insights.trend
    const prediction = insights.prediction || {} as any
    const DirectionIcon = prediction?.direction === 'up' ? TrendingUp : prediction?.direction === 'down' ? TrendingDown : Activity
    const directionColor = prediction?.direction === 'up' ? 'text-green-400' : prediction?.direction === 'down' ? 'text-red-400' : 'text-gray-400'
    const directionBg = prediction?.direction === 'up' ? 'bg-green-500/10 border-green-500/20' : prediction?.direction === 'down' ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-500/10 border-gray-500/20'
    const directionLabel = prediction?.direction === 'up' ? 'Bullish' : prediction?.direction === 'down' ? 'Bearish' : 'Stable'

    const chartData = history?.history?.map((h: any) => ({
        date: format(new Date(h.recorded_at), 'MMM dd'),
        score: h.overall_score,
        popularity: h.popularity_score,
        growth: h.growth_score,
        mentions: h.mention_count,
    })) || []

    // Radar mini-data
    const radarData = [
        { metric: 'Overall', value: trend?.overall_score || 0 },
        { metric: 'Popularity', value: trend?.popularity_score || 0 },
        { metric: 'Growth', value: trend?.growth_score || 0 },
        { metric: 'Articles', value: Math.min((trend?.article_count || 0) * 5, 100) },
        { metric: 'Repos', value: Math.min((trend?.repo_count || 0) * 10, 100) },
        { metric: 'Mentions', value: Math.min((trend?.mention_count || 0), 100) },
    ]

    const confidencePct = prediction?.confidence != null ? prediction.confidence * 100 : 0

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* ── Hero Banner ──────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-cosmic-500/20 via-purple-500/10 to-nebula-500/15" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cosmic-500/10 blur-[100px] rounded-full" />

                <div className="relative p-8 md:p-12">
                    {/* Nav */}
                    <button
                        onClick={() => navigate('/trends')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Trends
                    </button>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-bold text-purple-300 uppercase tracking-wider">
                                    {trend?.category || 'Technology'}
                                </span>
                                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${directionBg} ${directionColor}`}>
                                    <DirectionIcon className="w-3.5 h-3.5" />
                                    {directionLabel}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold gradient-text tracking-tight mb-3">
                                {trend?.name}
                            </h1>
                            {trend?.description && (
                                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">{trend.description}</p>
                            )}

                            {/* Metric pills */}
                            <div className="flex flex-wrap gap-3 mt-6">
                                <MetricPill icon={MessageSquare} label="Mentions" value={trend?.mention_count || 0} color="text-blue-400" bgColor="bg-blue-500/10" borderColor="border-blue-500/20" />
                                <MetricPill icon={Newspaper} label="Articles" value={trend?.article_count || 0} color="text-green-400" bgColor="bg-green-500/10" borderColor="border-green-500/20" />
                                <MetricPill icon={Github} label="Repos" value={trend?.repo_count || 0} color="text-nebula-400" bgColor="bg-nebula-500/10" borderColor="border-nebula-500/20" />
                            </div>
                        </div>

                        {/* Right: Score Gauges */}
                        <div className="flex items-center gap-6 shrink-0">
                            <div className="relative">
                                <ScoreGauge score={trend?.overall_score || 0} size={150} label="Overall" color="#818cf8" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Score Breakdown ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
                <div className="cosmic-card text-center group">
                    <BarChart3 className="w-6 h-6 text-cosmic-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">{safe(trend?.overall_score)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Overall</p>
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cosmic-gradient rounded-full transition-all duration-1000" style={{ width: `${trend?.overall_score || 0}%` }} />
                    </div>
                </div>
                <div className="cosmic-card text-center group">
                    <Eye className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">{safe(trend?.popularity_score)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Popularity</p>
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${trend?.popularity_score || 0}%` }} />
                    </div>
                </div>
                <div className="cosmic-card text-center group">
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">{safe(trend?.growth_score)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Growth</p>
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${trend?.growth_score || 0}%` }} />
                    </div>
                </div>
                <div className="cosmic-card text-center group">
                    <Activity className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-2xl font-black text-white">{insights.momentum?.toFixed(2) || '0.00'}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">Momentum</p>
                    <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(Math.abs(insights.momentum || 0) * 100, 100)}%` }} />
                    </div>
                </div>
            </div>

            {/* ── Charts Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* History Area Chart */}
                <div className="cosmic-card lg:col-span-2 group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cosmic-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                        <Clock className="w-5 h-5 mr-3 text-cosmic-400" />
                        Trend History
                        <span className="text-xs text-gray-500 ml-2 font-normal">30 days</span>
                    </h3>
                    {chartData.length > 0 ? (
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="detailColorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="detailColorPop" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d946ef" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="detailColorGrowth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                                    <YAxis stroke="#6b7280" fontSize={11} />
                                    <Tooltip content={<CosmicTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Area type="monotone" dataKey="score" name="Overall" stroke="#818cf8" fill="url(#detailColorScore)" strokeWidth={2.5} />
                                    <Area type="monotone" dataKey="popularity" name="Popularity" stroke="#d946ef" fill="url(#detailColorPop)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="growth" name="Growth" stroke="#10b981" fill="url(#detailColorGrowth)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[350px] flex flex-col items-center justify-center text-gray-500">
                            <Activity className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">No historical data available yet</p>
                        </div>
                    )}
                </div>

                {/* Radar Profile */}
                <div className="cosmic-card group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-3 text-purple-400" />
                        Profile Shape
                    </h3>
                    <div className="h-[310px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar name={trend?.name || ''} dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} strokeWidth={2} />
                                <Tooltip content={<CosmicTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Prediction Section ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prediction Analysis Card */}
                <div className="cosmic-card group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                        <Sparkles className="w-5 h-5 mr-3 text-amber-400" />
                        ML Prediction
                    </h3>
                    <div className="flex items-center gap-8 mb-6">
                        <div className="relative shrink-0">
                            <ScoreGauge score={confidencePct} size={120} label="Confidence" color="#f59e0b" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-400 font-bold">Predicted Score</span>
                                <span className="text-xl font-black text-white">{prediction?.predicted_score != null ? safe(prediction.predicted_score) : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-400 font-bold">Direction</span>
                                <span className={`flex items-center gap-1.5 text-sm font-bold ${directionColor}`}>
                                    <DirectionIcon className="w-4 h-4" />
                                    {prediction?.direction?.toUpperCase() || 'UNKNOWN'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-400 font-bold">Growth Rate</span>
                                <span className="text-sm font-bold text-white">{prediction?.growth_rate?.toFixed(3) || '0.000'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-gray-400 font-bold">Horizon</span>
                                <span className="text-sm font-bold text-white">{prediction?.days_ahead || 7} days ahead</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Trends */}
                <div className="cosmic-card group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                        <Link2 className="w-5 h-5 mr-3 text-blue-400" />
                        Related Trends
                    </h3>
                    {insights.related_trends?.length > 0 ? (
                        <div className="space-y-3">
                            {insights.related_trends.map((rt: any) => (
                                <div
                                    key={rt.id}
                                    className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-purple-500/20 transition-all cursor-pointer group/rt"
                                    onClick={() => navigate(`/trends/${rt.id}`)}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                                        <Layers className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm group-hover/rt:text-purple-300 transition-colors truncate">{rt.name}</p>
                                        <p className="text-[10px] text-gray-500">{rt.category}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-white">{rt.overall_score?.toFixed(1) || '0.0'}</p>
                                        <p className="text-[10px] text-gray-500">score</p>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover/rt:text-purple-400 transition-colors shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Link2 className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">No related trends discovered</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Top Articles ─────────────────────────────────────────── */}
            {insights.top_articles?.length > 0 && (
                <div className="cosmic-card group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                        <Newspaper className="w-5 h-5 mr-3 text-green-400" />
                        Top Articles
                        <span className="text-xs text-gray-500 ml-2 font-normal">{insights.top_articles.length} found</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                        {insights.top_articles.map((article: any) => (
                            <a
                                key={article.id}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-green-500/20 transition-all group/a"
                            >
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Newspaper className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white text-sm mb-1 line-clamp-2 group-hover/a:text-green-300 transition-colors">{article.title}</h4>
                                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{article.summary}</p>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                                        <span>{article.source}</span>
                                        <ExternalLink className="w-3 h-3 text-green-400" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Top Repos ────────────────────────────────────────────── */}
            {insights.top_repos?.length > 0 && (
                <div className="cosmic-card group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                        <Github className="w-5 h-5 mr-3 text-nebula-400" />
                        Top Repositories
                        <span className="text-xs text-gray-500 ml-2 font-normal">{insights.top_repos.length} found</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                        {insights.top_repos.map((repo: any) => (
                            <a
                                key={repo.id}
                                href={repo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-nebula-500/20 transition-all group/r"
                            >
                                <div className="w-10 h-10 rounded-lg bg-nebula-500/10 border border-nebula-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Github className="w-5 h-5 text-nebula-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-white text-sm mb-1 group-hover/r:text-nebula-300 transition-colors truncate">{repo.full_name}</h4>
                                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{repo.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                        {repo.language && <span className="text-nebula-400">{repo.language}</span>}
                                        <span>⭐ {repo.stars?.toLocaleString()}</span>
                                        <span>🍴 {repo.forks?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
