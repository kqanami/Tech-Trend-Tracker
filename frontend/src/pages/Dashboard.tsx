import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '../api/client'
import { useNavigate } from 'react-router-dom'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    Legend,
} from 'recharts'
import {
    TrendingUp, Newspaper, Github, Tag, Activity, Share2, Sparkles,
    BarChart3, Zap, ArrowRight, ArrowUpRight, Crown, Medal, Award,
    Eye, MessageSquare, Code, Star, Layers, Clock, Target, Flame
} from 'lucide-react'
import { lazy, Suspense } from 'react'
const KnowledgeGraph = lazy(() => import('../components/KnowledgeGraph'))

const CHART_COLORS = ['#818cf8', '#d946ef', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899']

const LANG_COLORS: Record<string, string> = {
    Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a', Go: '#00ADD8',
    Rust: '#dea584', 'C++': '#f34b7d', Java: '#b07219', Ruby: '#701516',
}

// ── Cosmic Tooltip ────────────────────────────────────────────────────────────
const CosmicTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-space-950/95 border border-white/10 backdrop-blur-xl rounded-xl p-3 shadow-2xl">
            <p className="text-xs text-gray-400 font-bold mb-1">{label}</p>
            {payload.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: e.color || e.fill || '#818cf8' }} />
                    <span className="text-gray-300">{e.name || e.dataKey}:</span>
                    <span className="font-bold text-white">{typeof e.value === 'number' ? e.value.toLocaleString() : e.value}</span>
                </div>
            ))}
        </div>
    )
}

// ── Animated Stat Card ────────────────────────────────────────────────────────
function HeroStat({ icon: Icon, label, value, today, color, gradient, onClick }: {
    icon: React.ElementType; label: string; value: number; today?: number
    color: string; gradient: string; onClick?: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={`cosmic-card group overflow-hidden relative ${onClick ? 'cursor-pointer hover:scale-[1.03]' : ''} transition-all duration-300`}
        >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient} opacity-40 group-hover:opacity-100 transition-opacity`} />
            {/* Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-').replace('400', '500')}/5 blur-3xl rounded-full pointer-events-none`} />

            <div className="relative">
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/10`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    {today != null && today > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400">
                            <Activity className="w-3 h-3" />
                            +{today} today
                        </span>
                    )}
                </div>
                <p className="text-3xl font-black text-white tracking-tight">{value.toLocaleString()}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mt-1">{label}</p>
            </div>
        </div>
    )
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickAction({ icon: Icon, title, desc, accent, route, navigate }: {
    icon: React.ElementType; title: string; desc: string; accent: string; route: string; navigate: (r: string) => void
}) {
    return (
        <div
            onClick={() => navigate(route)}
            className="cosmic-card cursor-pointer group hover:scale-[1.02] transition-all duration-300 overflow-hidden relative"
        >
            <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-${accent}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className={`absolute -top-8 -right-8 w-24 h-24 bg-${accent}-500/5 blur-2xl rounded-full pointer-events-none`} />
            <div className="relative flex items-start justify-between">
                <div className="flex-1">
                    <div className={`w-10 h-10 rounded-xl bg-${accent}-500/10 border border-${accent}-500/20 flex items-center justify-center mb-3`}>
                        <Icon className={`w-5 h-5 text-${accent}-400`} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-white/90">{title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
                <ArrowUpRight className={`w-4 h-4 text-gray-600 group-hover:text-${accent}-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 shrink-0 mt-1`} />
            </div>
        </div>
    )
}

// ── Trending Card ─────────────────────────────────────────────────────────────
function TrendCard({ trend, rank, navigate }: { trend: any; rank: number; navigate: (r: string) => void }) {
    const icons = [Crown, Medal, Award]
    const Icon = icons[rank] || Target
    const colors = [
        { ring: 'ring-yellow-500/20', bg: 'from-yellow-500/10 to-amber-500/5', text: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(234,179,8,0.08)]' },
        { ring: 'ring-gray-400/20', bg: 'from-gray-400/5 to-gray-500/5', text: 'text-gray-300', glow: '' },
        { ring: 'ring-amber-600/20', bg: 'from-amber-600/5 to-orange-500/5', text: 'text-amber-500', glow: '' },
    ]
    const c = colors[rank] || { ring: 'ring-white/5', bg: 'from-white/5 to-transparent', text: 'text-gray-400', glow: '' }

    return (
        <div
            onClick={() => navigate(`/trends/${trend.id}`)}
            className={`cosmic-card bg-gradient-to-b ${c.bg} ring-1 ${c.ring} ${c.glow} cursor-pointer group hover:scale-[1.02] transition-all duration-300 flex flex-col overflow-hidden`}
        >
            <div className="flex items-center justify-between mb-3">
                <Icon className={`w-6 h-6 ${c.text}`} />
                <span className="text-[10px] font-bold text-cosmic-400/70 bg-cosmic-500/10 px-2 py-0.5 rounded border border-cosmic-500/20 uppercase tracking-wider">
                    {trend.category}
                </span>
            </div>
            <h4 className="text-lg font-extrabold text-white mb-1 group-hover:text-cosmic-300 transition-colors leading-tight line-clamp-1">
                {trend.name}
            </h4>
            <p className="text-[11px] text-gray-400 line-clamp-2 mb-4 leading-relaxed flex-1">
                {trend.description || 'Monitoring emerging patterns in this technology sector.'}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-3">
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{trend.mention_count}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{trend.popularity_score?.toFixed(1) || '0.0'}</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{trend.growth_score?.toFixed(1) || '0.0'}</span>
            </div>
            <div>
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-gray-500">Signal Strength</span>
                    <span className="text-cosmic-400">{trend.overall_score?.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-cosmic-600 via-purple-500 to-nebula-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                        style={{ width: `${Math.min(trend.overall_score || 0, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
    const navigate = useNavigate()
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await dashboardAPI.getStats()
            return response.data
        },
        refetchInterval: 15 * 60 * 1000,
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-cosmic-500/20 border-t-cosmic-500 rounded-full animate-spin" />
                    <Zap className="w-8 h-8 text-cosmic-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-cosmic-400 font-bold animate-pulse text-sm">Loading cosmic intelligence...</p>
            </div>
        )
    }

    // Prepare language pie data with real colors
    const languagePieData = (stats?.top_languages || []).map((l: any) => ({
        ...l,
        fill: LANG_COLORS[l.name] || '#6b7280',
    }))

    // Source bar data — enrich for area chart
    const sourceData = stats?.top_sources || []

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-700">
            {/* ══ Hero Header ══════════════════════════════════════════ */}
            <div className="relative text-center py-10">
                <div className="absolute inset-0 bg-gradient-to-b from-cosmic-500/5 via-purple-500/3 to-transparent rounded-3xl" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cosmic-500/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="relative">
                            <Sparkles className="w-12 h-12 text-cosmic-400" />
                            <div className="absolute inset-0 blur-xl bg-cosmic-500/30 animate-pulse" />
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight gradient-text animate-float mb-4">
                        Tech Trend Tracker
                    </h1>
                    <p className="text-gray-400 font-light max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        Exploring the digital frontier. Discover the pulse of global technology trends in real-time. 🌠
                    </p>
                    {/* Live indicator */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-500">Cosmic Edition — Live</span>
                    </div>
                </div>
            </div>

            {/* ══ Stats Grid ═══════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
                <HeroStat
                    icon={Newspaper} label="Total Articles" value={stats?.total_articles || 0}
                    today={stats?.articles_today} color="text-cosmic-400"
                    gradient="from-transparent via-cosmic-500 to-transparent"
                    onClick={() => navigate('/articles')}
                />
                <HeroStat
                    icon={Github} label="Repositories" value={stats?.total_repos || 0}
                    today={stats?.repos_today} color="text-nebula-400"
                    gradient="from-transparent via-nebula-500 to-transparent"
                    onClick={() => navigate('/repositories')}
                />
                <HeroStat
                    icon={TrendingUp} label="Trends Tracked" value={stats?.total_trends || 0}
                    color="text-purple-400"
                    gradient="from-transparent via-purple-500 to-transparent"
                    onClick={() => navigate('/trends')}
                />
                <HeroStat
                    icon={Tag} label="Total Tags" value={stats?.total_tags || 0}
                    color="text-blue-400"
                    gradient="from-transparent via-blue-500 to-transparent"
                />
            </div>

            {/* ══ Charts Grid ══════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Intelligence Sources — Bar Chart (2 cols) */}
                <div className="cosmic-card lg:col-span-2 group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cosmic-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                        <Newspaper className="w-5 h-5 mr-3 text-cosmic-400" />
                        Intelligence Sources
                        <span className="text-xs text-gray-500 ml-2 font-normal">{sourceData.length} active</span>
                    </h3>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sourceData}>
                                <defs>
                                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity={0.3} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip content={<CosmicTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" name="Articles" fill="url(#barGrad)" radius={[6, 6, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Language Ecosystems — Donut Chart */}
                <div className="cosmic-card group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                    <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                        <Code className="w-5 h-5 mr-3 text-nebula-400" />
                        Language Ecosystems
                    </h3>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={languagePieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="40%"
                                    outerRadius="70%"
                                    paddingAngle={4}
                                    dataKey="count"
                                    nameKey="name"
                                    strokeWidth={0}
                                >
                                    {languagePieData.map((entry: any, idx: number) => (
                                        <Cell key={idx} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CosmicTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 10 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Language list below chart */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {languagePieData.slice(0, 6).map((l: any) => (
                            <div key={l.name} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.fill }} />
                                <span className="text-[10px] font-bold text-gray-300 truncate">{l.name}</span>
                                <span className="text-[10px] text-gray-500 ml-auto shrink-0">{l.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ Trending Now ═════════════════════════════════════════ */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-extrabold text-white flex items-center">
                        <Flame className="w-7 h-7 mr-3 text-orange-400" />
                        Trending Horizons
                        <span className="text-xs text-gray-500 ml-3 font-normal">Top signals right now</span>
                    </h3>
                    <button
                        onClick={() => navigate('/trends')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
                    {stats?.trending_now?.slice(0, 6).map((trend: any, i: number) => (
                        <TrendCard key={trend.id} trend={trend} rank={i} navigate={navigate} />
                    ))}
                </div>
            </div>

            {/* ══ Quick Actions ════════════════════════════════════════ */}
            <div className="space-y-5">
                <h3 className="text-xl font-extrabold text-white flex items-center">
                    <Zap className="w-6 h-6 mr-3 text-amber-400" />
                    Command Center
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    <QuickAction
                        icon={Zap} title="Emerging Trends" desc="Fastest-growing technologies right now"
                        accent="green" route="/emerging" navigate={navigate}
                    />
                    <QuickAction
                        icon={BarChart3} title="Compare Technologies" desc="Side-by-side comparison of up to 10 trends"
                        accent="purple" route="/compare" navigate={navigate}
                    />
                    <QuickAction
                        icon={Sparkles} title="Recommendations" desc="Personalized trend suggestions for you"
                        accent="nebula" route="/recommendations" navigate={navigate}
                    />
                    <QuickAction
                        icon={Activity} title="Advanced Statistics" desc="Deep insights and analytics dashboard"
                        accent="blue" route="/statistics" navigate={navigate}
                    />
                </div>
            </div>

            {/* ══ Knowledge Graph Galaxy (UNTOUCHED) ═══════════════════ */}
            <div className="pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold flex items-center text-white">
                        <Share2 className="w-8 h-8 mr-4 text-cosmic-400" />
                        Technology Galaxy
                    </h3>
                </div>
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-cosmic-500/20 border-t-cosmic-500 rounded-full animate-spin" />
                            <Star className="w-8 h-8 text-cosmic-400 absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <p className="text-cosmic-400 font-bold animate-pulse text-sm">Initializing galaxy mapping...</p>
                    </div>
                }>
                    <KnowledgeGraph />
                </Suspense>
            </div>

        </div>
    )
}
