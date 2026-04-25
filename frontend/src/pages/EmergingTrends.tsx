import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../api/client'
import {
    TrendingUp, Activity, Calendar, Filter, Zap, Rocket, ArrowUpRight,
    Flame, Target, Crown, Medal, Award, BarChart3, Eye, MessageSquare,
    ChevronRight, Sparkles, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Cell,
} from 'recharts'

// ── Cosmic Tooltip ────────────────────────────────────────────────────────────
const CosmicTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-space-950/95 border border-white/10 backdrop-blur-xl rounded-xl p-3 shadow-2xl">
            <p className="text-xs text-gray-400 font-bold mb-1">{payload[0]?.payload?.fullName || label}</p>
            {payload.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: e.color || e.fill || '#10b981' }} />
                    <span className="text-gray-300">{e.name}:</span>
                    <span className="font-bold text-white">{typeof e.value === 'number' ? e.value.toFixed(1) : e.value}</span>
                </div>
            ))}
        </div>
    )
}

// ── Time Window Pill ──────────────────────────────────────────────────────────
function TimePill({ label, value, active, onClick }: { label: string; value: number; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${active
                ? 'bg-green-500/20 text-green-300 border-green-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                }`}
        >
            <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            {label}
        </button>
    )
}

// ── Rocket Card (Top 3 Podium) ────────────────────────────────────────────────
function RocketCard({ trend, rank, navigate }: { trend: any; rank: number; navigate: (r: string) => void }) {
    const icons = [Crown, Medal, Award]
    const Icon = icons[rank] || Rocket
    const colors = [
        { ring: 'ring-yellow-500/30', bg: 'from-yellow-500/15 to-amber-500/5', text: 'text-yellow-400', bar: 'from-yellow-500 to-amber-400', glow: 'shadow-[0_0_25px_rgba(234,179,8,0.12)]' },
        { ring: 'ring-gray-400/30', bg: 'from-gray-400/10 to-gray-500/5', text: 'text-gray-300', bar: 'from-gray-400 to-gray-300', glow: '' },
        { ring: 'ring-amber-600/30', bg: 'from-amber-600/10 to-orange-500/5', text: 'text-amber-500', bar: 'from-amber-500 to-orange-400', glow: '' },
    ]
    const c = colors[rank] || colors[2]

    return (
        <div
            onClick={() => navigate(`/trends/${trend.trend_id}`)}
            className={`cosmic-card bg-gradient-to-b ${c.bg} ring-1 ${c.ring} ${c.glow} cursor-pointer group hover:scale-[1.02] transition-all duration-300 flex flex-col overflow-hidden`}
        >
            <div className="flex items-center justify-between mb-3">
                <Icon className={`w-7 h-7 ${c.text}`} />
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider flex items-center gap-1">
                    <Rocket className="w-3 h-3" />
                    +{trend.growth_rate.toFixed(0)}%
                </span>
            </div>
            <h3 className="text-xl font-extrabold text-white mb-1 group-hover:text-green-300 transition-colors leading-tight line-clamp-1">
                {trend.name}
            </h3>
            <p className="text-[10px] font-bold text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wider w-fit mb-3">
                {trend.category}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                    <p className="text-lg font-black text-white">{trend.current_score.toFixed(1)}</p>
                    <p className="text-[8px] text-gray-500 uppercase">Score</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                    <p className="text-lg font-black text-green-400">+{trend.growth_rate.toFixed(1)}%</p>
                    <p className="text-[8px] text-gray-500 uppercase">Growth</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                    <p className={`text-lg font-black ${trend.score_change > 0 ? 'text-green-400' : trend.score_change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {trend.score_change > 0 ? '+' : ''}{trend.score_change.toFixed(1)}
                    </p>
                    <p className="text-[8px] text-gray-500 uppercase">Change</p>
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-gray-500">Momentum</span>
                    <span className="text-green-400">{trend.growth_rate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.3)]`}
                        style={{ width: `${Math.min(trend.growth_rate, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
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

    const chartData = useMemo(() =>
        emerging?.trends?.map((trend) => ({
            name: trend.name.length > 12 ? trend.name.substring(0, 10) + '..' : trend.name,
            fullName: trend.name,
            growth_rate: trend.growth_rate,
            current_score: trend.current_score,
            score_change: trend.score_change,
        })) || [],
        [emerging]
    )

    // Radar data from top trends
    const radarData = useMemo(() =>
        emerging?.trends?.slice(0, 6).map((t) => ({
            subject: t.name.length > 10 ? t.name.substring(0, 8) + '..' : t.name,
            growth: t.growth_rate,
            score: t.current_score,
        })) || [],
        [emerging]
    )

    const stats = useMemo(() => {
        if (!emerging?.trends?.length) return null
        const trends = emerging.trends
        const avgGrowth = trends.reduce((s, t) => s + t.growth_rate, 0) / trends.length
        const maxGrowth = Math.max(...trends.map(t => t.growth_rate))
        const avgScore = trends.reduce((s, t) => s + t.current_score, 0) / trends.length
        const fastest = trends[0]
        return { count: trends.length, avgGrowth, maxGrowth, avgScore, fastest }
    }, [emerging])

    const top3 = emerging?.trends?.slice(0, 3) || []
    const rest = emerging?.trends?.slice(3) || []

    // Bar colors based on growth
    const getBarColor = (growth: number) => {
        if (growth >= 50) return '#10b981'
        if (growth >= 30) return '#22d3ee'
        if (growth >= 15) return '#818cf8'
        return '#6b7280'
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* ══ Hero Header ═══════════════════════════════════════════ */}
            <div className="relative text-center py-8">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent rounded-3xl" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-green-500/8 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="relative">
                            <Rocket className="w-12 h-12 text-green-400" />
                            <div className="absolute inset-0 blur-xl bg-green-500/30 animate-pulse" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text tracking-tight">
                            Emerging Trends
                        </h1>
                    </div>
                    <p className="text-gray-400 font-light max-w-2xl mx-auto text-sm md:text-base">
                        Discover the fastest-growing technologies gaining momentum right now. These signals are accelerating. 🚀
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">Real-time growth detection</span>
                    </div>
                </div>
            </div>

            {/* ══ Time Window Filter ════════════════════════════════════ */}
            <div className="cosmic-card glass-dark space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-green-400" />
                        <h3 className="text-base font-bold text-white">Detection Parameters</h3>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <TimePill label="7 days" value={7} active={days === 7} onClick={() => setDays(7)} />
                        <TimePill label="14 days" value={14} active={days === 14} onClick={() => setDays(14)} />
                        <TimePill label="30 days" value={30} active={days === 30} onClick={() => setDays(30)} />
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold">Min Growth:</span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500/50 text-center"
                                value={minGrowth}
                                onChange={(e) => setMinGrowth(Number(e.target.value))}
                            />
                            <span className="text-xs text-gray-500 font-bold">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ Content ══════════════════════════════════════════════ */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
                        <Rocket className="w-8 h-8 text-green-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <p className="text-green-400 font-bold animate-pulse text-sm">Scanning for emerging signals...</p>
                </div>
            ) : emerging && emerging.trends.length > 0 ? (
                <>
                    {/* ── Stats Row ───────────────────────────────── */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
                            <div className="cosmic-card group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Detected</span>
                                    <Activity className="w-4 h-4 text-green-400" />
                                </div>
                                <p className="text-3xl font-black text-white">{stats.count}</p>
                                <p className="text-[10px] text-gray-500 mt-1">emerging signals</p>
                            </div>
                            <div className="cosmic-card group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Avg Growth</span>
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-3xl font-black text-emerald-400">+{stats.avgGrowth.toFixed(1)}%</p>
                            </div>
                            <div className="cosmic-card group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Max Growth</span>
                                    <Flame className="w-4 h-4 text-cyan-400" />
                                </div>
                                <p className="text-3xl font-black text-cyan-400">+{stats.maxGrowth.toFixed(1)}%</p>
                            </div>
                            <div className="cosmic-card group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Avg Score</span>
                                    <Target className="w-4 h-4 text-purple-400" />
                                </div>
                                <p className="text-3xl font-black text-white">{stats.avgScore.toFixed(1)}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Top 3 Rockets ───────────────────────────── */}
                    {top3.length >= 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
                            {top3.map((trend, i) => (
                                <RocketCard key={trend.trend_id} trend={trend} rank={i} navigate={navigate} />
                            ))}
                        </div>
                    )}

                    {/* ── Charts Row ──────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Growth Rate Bar Chart */}
                        <div className="cosmic-card lg:col-span-2 group overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-3 text-green-400" />
                                Growth Rate Comparison
                                <span className="text-xs text-gray-500 ml-2 font-normal">{days}-day window</span>
                            </h3>
                            <div className="h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <defs>
                                            <linearGradient id="emergingBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#6b7280" fontSize={10} angle={-35} textAnchor="end" height={70} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CosmicTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="growth_rate" name="Growth (%)" radius={[5, 5, 0, 0]} barSize={35}>
                                            {chartData.map((entry, idx) => (
                                                <Cell key={idx} fill={getBarColor(entry.growth_rate)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Growth vs Score Radar */}
                        <div className="cosmic-card group overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                                <Sparkles className="w-5 h-5 mr-3 text-purple-400" />
                                Growth Profile
                            </h3>
                            <div className="h-[340px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis tick={false} />
                                        <Radar name="Growth %" dataKey="growth" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                                        <Radar name="Score" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} strokeWidth={2} />
                                        <Tooltip content={<CosmicTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* ── Full List ───────────────────────────────── */}
                    <div>
                        <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-3 text-green-400" />
                            All Emerging Signals
                            <span className="text-xs text-gray-500 ml-2 font-normal">{emerging.trends.length} detected</span>
                        </h3>
                        <div className="space-y-3 stagger-children">
                            {rest.map((trend, index) => {
                                const rank = index + 4
                                return (
                                    <div
                                        key={trend.trend_id}
                                        className="cosmic-card !p-4 group/item cursor-pointer flex items-center gap-5 hover:!border-green-500/30 transition-all"
                                        onClick={() => navigate(`/trends/${trend.trend_id}`)}
                                    >
                                        <div className="text-2xl font-black text-white/5 group-hover/item:text-green-500/20 transition-colors w-10 text-center shrink-0">
                                            {String(rank).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h4 className="font-bold text-white text-base group-hover/item:text-green-300 transition-colors truncate">
                                                    {trend.name}
                                                </h4>
                                                <span className="text-[10px] font-bold text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wide shrink-0">
                                                    {trend.category}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-green-600 via-emerald-500 to-cyan-400 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                    style={{ width: `${Math.min(trend.growth_rate, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                                                <span className="flex items-center gap-1"><Target className="w-3 h-3" />Score: {trend.current_score.toFixed(1)}</span>
                                                <span className={`flex items-center gap-1 ${trend.score_change > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                                    <Activity className="w-3 h-3" />{trend.score_change > 0 ? '+' : ''}{trend.score_change.toFixed(1)} pts
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xl font-black text-green-400">+{trend.growth_rate.toFixed(1)}%</span>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest">growth</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover/item:text-green-400 transition-colors shrink-0" />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Rocket className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white">No Emerging Signals</h3>
                    <p className="text-sm text-gray-400 text-center max-w-md">
                        No trends found exceeding {minGrowth}% growth in the last {days} days.<br />
                        Try lowering the minimum growth threshold.
                    </p>
                    <button
                        onClick={() => setMinGrowth(5)}
                        className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm font-bold hover:bg-green-500/30 transition-all"
                    >
                        Lower threshold to 5%
                    </button>
                </div>
            )}
        </div>
    )
}
