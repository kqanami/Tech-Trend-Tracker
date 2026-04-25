import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trendsAPI, analyticsAPI, type Trend } from '../api/client'
import { useNavigate } from 'react-router-dom'
import {
    TrendingUp, TrendingDown, Search, Activity, BarChart3, Zap, ArrowRight, Sparkles,
    Flame, Trophy, Eye, GitFork, MessageSquare, ChevronRight, X, ExternalLink,
    Layers, Target, Rocket, Crown, Medal, Award, Filter, ArrowUpRight, Clock,
    Star
} from 'lucide-react'
import { NoTrends } from '../components/EmptyState'
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
    Cell,
    Legend,
    PieChart,
    Pie,
} from 'recharts'

// ── Tab definitions ───────────────────────────────────────────────────────────
type TabId = 'overview' | 'emerging' | 'compare'

const tabs: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'overview', label: 'Signal Matrix', icon: Activity, description: 'All trends ranked by velocity' },
    { id: 'emerging', label: 'Rising Stars', icon: Flame, description: 'Fastest growing technologies' },
    { id: 'compare', label: 'Battle Arena', icon: Trophy, description: 'Compare technologies head-to-head' },
]

// ── Gradient colors for chart elements ────────────────────────────────────────
const CHART_COLORS = ['#818cf8', '#d946ef', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899']
const GRADIENT_PAIRS = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a18cd1', '#fbc2eb'],
]

// ── Helper: safe toFixed ──────────────────────────────────────────────────────
const safe = (val: number | null | undefined, decimals = 1, fallback = '0.0') =>
    val != null ? val.toFixed(decimals) : fallback

// ── Podium Medal Component ────────────────────────────────────────────────────
function PodiumCard({ trend, rank, onClick }: { trend: Trend; rank: number; onClick: () => void }) {
    const icons = [Crown, Medal, Award]
    const Icon = icons[rank] || Award
    const colors = [
        { ring: 'ring-yellow-500/40', bg: 'from-yellow-500/20 to-amber-500/5', text: 'text-yellow-400', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.2)]' },
        { ring: 'ring-gray-400/40', bg: 'from-gray-400/15 to-gray-500/5', text: 'text-gray-300', glow: 'shadow-[0_0_20px_rgba(156,163,175,0.15)]' },
        { ring: 'ring-amber-600/40', bg: 'from-amber-600/15 to-orange-500/5', text: 'text-amber-500', glow: 'shadow-[0_0_20px_rgba(217,119,6,0.15)]' },
    ]
    const c = colors[rank] || colors[2]

    return (
        <button
            onClick={onClick}
            className={`cosmic-card group cursor-pointer bg-gradient-to-b ${c.bg} ring-1 ${c.ring} ${c.glow} flex flex-col items-center justify-center text-center py-8 px-4 hover:scale-[1.03] transition-all duration-300`}
        >
            <Icon className={`w-10 h-10 ${c.text} mb-3 drop-shadow-lg`} />
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${c.text} mb-2`}>
                {rank === 0 ? '1st Place' : rank === 1 ? '2nd Place' : '3rd Place'}
            </span>
            <h3 className="text-xl font-extrabold text-white mb-1 group-hover:text-purple-300 transition-colors">
                {trend.name}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{trend.category}</p>
            <div className="flex items-center gap-3 text-sm">
                <span className="font-black text-2xl text-white">{safe(trend.overall_score)}</span>
                <span className="text-gray-500 text-xs">pts</span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{trend.mention_count}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{safe(trend.popularity_score)}</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{safe(trend.growth_score)}</span>
            </div>
        </button>
    )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-cosmic-400' }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
    return (
        <div className="cosmic-card group overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{label}</span>
                <Icon className={`w-4 h-4 ${color} shrink-0`} />
            </div>
            <p className="text-2xl font-black text-white truncate" title={String(value)}>{value}</p>
            {sub && <p className="text-[11px] text-gray-500 mt-1 truncate">{sub}</p>}
        </div>
    )
}

// ── Category Pill ─────────────────────────────────────────────────────────────
function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap border ${active
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                }`}
        >
            {label}
        </button>
    )
}

// ── Custom tooltip for charts ─────────────────────────────────────────────────
const CosmicTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-space-950/95 border border-white/10 backdrop-blur-xl rounded-xl p-3 shadow-2xl">
            <p className="text-xs text-gray-400 font-bold mb-1">{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                    <span className="text-gray-300">{entry.name}:</span>
                    <span className="font-bold text-white">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
                </div>
            ))}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Trends() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabId>('overview')
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [selectedDetail, setSelectedDetail] = useState<Trend | null>(null)

    // ── Compare state ─────────────────────────────────────────────────────────
    const [compareIds, setCompareIds] = useState<number[]>([])
    const [compareSearch, setCompareSearch] = useState('')

    // ── Emerging state ────────────────────────────────────────────────────────
    const [emergingDays, setEmergingDays] = useState(7)
    const [emergingMinGrowth, setEmergingMinGrowth] = useState(5)

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ['trends', page, search, category],
        queryFn: async () => {
            const response = await trendsAPI.getAll({
                page,
                page_size: 20,
                search: search || undefined,
                category: category === 'All' ? undefined : category,
            })
            return response.data
        },
        refetchInterval: 15 * 60 * 1000,
    })

    const { data: categoriesData } = useQuery({
        queryKey: ['trend-categories'],
        queryFn: async () => {
            try {
                const response = await trendsAPI.getCategories()
                return response.data
            } catch {
                return []
            }
        },
    })

    const { data: emergingData, isLoading: emergingLoading } = useQuery({
        queryKey: ['emerging-trends', emergingDays, emergingMinGrowth],
        queryFn: async () => {
            try {
                const response = await analyticsAPI.getEmergingTrends(emergingDays, emergingMinGrowth, 20)
                return response.data
            } catch {
                return { trends: [], days: emergingDays, min_growth: emergingMinGrowth }
            }
        },
        enabled: activeTab === 'emerging',
    })

    const { data: comparison, isLoading: compareLoading } = useQuery({
        queryKey: ['trend-comparison', compareIds],
        queryFn: async () => {
            const response = await analyticsAPI.compareTrends(compareIds)
            return response.data
        },
        enabled: compareIds.length >= 2 && activeTab === 'compare',
    })

    // ── Derived data ──────────────────────────────────────────────────────────
    const categories = useMemo(() => {
        const cats = categoriesData || []
        return ['All', ...cats]
    }, [categoriesData])

    const top3 = useMemo(() => data?.items?.slice(0, 3) || [], [data])
    const restItems = useMemo(() => data?.items?.slice(3) || [], [data])

    // Radar chart data (top 6)
    const radarData = useMemo(() =>
        data?.items?.slice(0, 6).map((t) => ({
            subject: t.name.length > 12 ? t.name.substring(0, 10) + '..' : t.name,
            overall: t.overall_score || 0,
            popularity: t.popularity_score || 0,
            growth: t.growth_score || 0,
        })) || [],
        [data]
    )

    // Category distribution pie chart
    const categoryDistribution = useMemo(() => {
        if (!data?.items) return []
        const map = new Map<string, number>()
        data.items.forEach(t => {
            const cat = t.category || 'Uncategorized'
            map.set(cat, (map.get(cat) || 0) + 1)
        })
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
    }, [data])

    // Compare chart data
    const compareChartData = useMemo(() =>
        comparison?.trends?.map((t) => ({
            name: t.name.length > 15 ? t.name.substring(0, 12) + '...' : t.name,
            fullName: t.name,
            overall_score: t.overall_score || 0,
            popularity_score: t.popularity_score || 0,
            growth_score: t.growth_score || 0,
            mention_count: t.mention_count || 0,
        })) || [],
        [comparison]
    )

    // Compare filtered list
    const compareFilteredTrends = useMemo(() =>
        data?.items?.filter(t =>
            t.name.toLowerCase().includes(compareSearch.toLowerCase()) &&
            !compareIds.includes(t.id)
        )?.slice(0, 15) || [],
        [data, compareSearch, compareIds]
    )

    const toggleCompare = useCallback((id: number) => {
        setCompareIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : prev.length < 10 ? [...prev, id] : prev
        )
    }, [])

    // ── Aggregate stats ───────────────────────────────────────────────────────
    const stats = useMemo(() => {
        if (!data?.items?.length) return null
        const items = data.items
        const avgScore = items.reduce((s, t) => s + (t.overall_score || 0), 0) / items.length
        const totalMentions = items.reduce((s, t) => s + (t.mention_count || 0), 0)
        const topCategory = categoryDistribution.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'
        const maxGrowth = Math.max(...items.map(t => t.growth_score || 0))
        return { avgScore, totalMentions, topCategory, maxGrowth, total: data.total }
    }, [data, categoryDistribution])

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* ── Hero Header ────────────────────────────────────────────── */}
            <div className="relative text-center py-8">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-3xl" />
                <div className="relative">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="relative">
                            <Zap className="w-12 h-12 text-purple-500" />
                            <div className="absolute inset-0 blur-xl bg-purple-500/30 animate-pulse" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text tracking-tight">
                            Trend Observatory
                        </h1>
                    </div>
                    <p className="text-gray-400 font-light max-w-2xl mx-auto text-sm md:text-base">
                        Real-time intelligence on emerging technology clusters, growth trajectories, and market signals across the tech ecosystem.
                    </p>
                </div>
            </div>

            {/* ── Tab Bar ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border ${isActive
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* ═══════ TAB: OVERVIEW ═══════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <>
                    {/* Stat Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
                            <StatCard icon={Layers} label="Total Trends" value={stats.total} color="text-cosmic-400" />
                            <StatCard icon={Target} label="Avg Score" value={safe(stats.avgScore)} color="text-purple-400" />
                            <StatCard icon={MessageSquare} label="Total Mentions" value={stats.totalMentions.toLocaleString()} color="text-blue-400" />
                            <StatCard icon={Rocket} label="Top Category" value={stats.topCategory} color="text-green-400" />
                            <StatCard icon={TrendingUp} label="Max Growth" value={safe(stats.maxGrowth)} color="text-amber-400" />
                        </div>
                    )}

                    {/* Search + Category Pills */}
                    <div className="cosmic-card glass-dark space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search technology signals..."
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-500 transition-all font-medium"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg border transition-all ${viewMode === 'list' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Layers className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            {categories.map((cat) => (
                                <CategoryPill
                                    key={cat}
                                    label={cat}
                                    active={category === cat}
                                    onClick={() => { setCategory(cat); setPage(1) }}
                                />
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="cosmic-card h-[180px] animate-pulse flex flex-col gap-3">
                                    <div className="h-5 w-1/3 bg-white/5 rounded" />
                                    <div className="h-4 w-full bg-white/5 rounded" />
                                    <div className="h-3 w-2/3 bg-white/5 rounded" />
                                    <div className="h-2 w-full bg-white/5 rounded-full mt-auto" />
                                </div>
                            ))}
                        </div>
                    ) : !data?.items?.length ? (
                        <NoTrends />
                    ) : (
                        <>
                            {/* ── Top 3 Podium ──────────────────────────────── */}
                            {page === 1 && !search && category === 'All' && top3.length >= 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
                                    {top3.map((trend, idx) => (
                                        <PodiumCard
                                            key={trend.id}
                                            trend={trend}
                                            rank={idx}
                                            onClick={() => navigate(`/trends/${trend.id}`)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ── Charts Row ────────────────────────────────── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Radar */}
                                <div className="cosmic-card lg:col-span-2 flex flex-col group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                    <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                                        <Activity className="w-5 h-5 mr-3 text-purple-400" />
                                        Multi-Dimensional Radar
                                    </h3>
                                    <div className="flex-1 min-h-[380px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} />
                                                <Radar name="Overall" dataKey="overall" stroke="#818cf8" fill="#818cf8" fillOpacity={0.15} strokeWidth={2} />
                                                <Radar name="Popularity" dataKey="popularity" stroke="#d946ef" fill="#d946ef" fillOpacity={0.1} strokeWidth={2} />
                                                <Radar name="Growth" dataKey="growth" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                                                <Tooltip content={<CosmicTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Category Pie */}
                                <div className="cosmic-card flex flex-col group overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                    <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                                        <Sparkles className="w-5 h-5 mr-3 text-nebula-400" />
                                        Category Split
                                    </h3>
                                    <div className="flex-1 min-h-[380px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoryDistribution}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius="70%"
                                                    innerRadius="45%"
                                                    paddingAngle={3}
                                                    strokeWidth={0}
                                                >
                                                    {categoryDistribution.map((_, idx) => (
                                                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CosmicTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* ── Trend List / Grid ─────────────────────────── */}
                            <div>
                                <h3 className="text-lg font-extrabold text-white mb-4 flex items-center justify-between">
                                    <span className="flex items-center">
                                        <BarChart3 className="w-5 h-5 mr-3 text-cosmic-400" />
                                        {page === 1 && !search && category === 'All' ? 'All Signals' : 'Filtered Signals'}
                                    </span>
                                    <span className="text-xs text-gray-500 font-normal">{data.total} total</span>
                                </h3>

                                {viewMode === 'list' ? (
                                    <div className="space-y-3 stagger-children">
                                        {(page === 1 && !search && category === 'All' ? restItems : data.items).map((trend, index) => {
                                            const rank = (page === 1 && !search && category === 'All')
                                                ? index + 4
                                                : (page - 1) * 20 + index + 1
                                            const isExpanded = selectedDetail?.id === trend.id
                                            return (
                                                <div key={trend.id} className="space-y-0">
                                                    <div
                                                        className={`cosmic-card !p-4 group/item cursor-pointer flex items-center gap-5 hover:!border-purple-500/30 ${isExpanded ? '!border-purple-500/30 !border-b-0 !rounded-b-none' : ''}`}
                                                        onClick={() => setSelectedDetail(isExpanded ? null : trend)}
                                                    >
                                                        <div className="text-2xl font-black text-white/5 group-hover/item:text-purple-500/20 transition-colors w-10 text-center shrink-0">
                                                            {String(rank).padStart(2, '0')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1.5">
                                                                <h4 className="font-bold text-white text-base group-hover/item:text-purple-300 transition-colors truncate">
                                                                    {trend.name}
                                                                </h4>
                                                                <span className="text-[10px] font-bold text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wide shrink-0">
                                                                    {trend.category}
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                                                <div
                                                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cosmic-500 transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                                                    style={{ width: `${Math.min(trend.overall_score || 0, 100)}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                                                                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{trend.mention_count} mentions</span>
                                                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Pop: {safe(trend.popularity_score)}</span>
                                                                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Growth: {safe(trend.growth_score)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-xl font-black text-white">{safe(trend.overall_score)}</span>
                                                            <span className="text-[10px] text-gray-500 ml-1">pts</span>
                                                        </div>
                                                        <ChevronRight className={`w-4 h-4 text-gray-600 group-hover/item:text-purple-400 transition-all shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>
                                                    {/* Inline expand panel */}
                                                    {isExpanded && (
                                                        <div className="cosmic-card !border-purple-500/30 !rounded-t-none !border-t-0 !pt-2 animate-in slide-in-from-top-2 duration-200">
                                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                                                                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Overall</p>
                                                                    <p className="text-xl font-black text-white">{safe(trend.overall_score)}</p>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Popularity</p>
                                                                    <p className="text-xl font-black text-purple-400">{safe(trend.popularity_score)}</p>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Growth</p>
                                                                    <p className="text-xl font-black text-green-400">{safe(trend.growth_score)}</p>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Mentions</p>
                                                                    <p className="text-xl font-black text-blue-400">{trend.mention_count}</p>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Category</p>
                                                                    <p className="text-sm font-bold text-amber-400">{trend.category}</p>
                                                                </div>
                                                            </div>
                                                            {trend.description && (
                                                                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{trend.description}</p>
                                                            )}
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/trends/${trend.id}`) }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-lg text-xs font-bold text-purple-300 hover:bg-purple-500/30 transition-all"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    Full Analysis →
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                                        {(page === 1 && !search && category === 'All' ? restItems : data.items).map((trend, index) => {
                                            const rank = (page === 1 && !search && category === 'All')
                                                ? index + 4
                                                : (page - 1) * 20 + index + 1
                                            return (
                                                <div
                                                    key={trend.id}
                                                    className="cosmic-card group/item cursor-pointer hover:!border-purple-500/30"
                                                    onClick={() => setSelectedDetail(selectedDetail?.id === trend.id ? null : trend)}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs font-black text-white/10">#{rank}</span>
                                                        <span className="text-[10px] font-bold text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-wide">
                                                            {trend.category}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-white mb-2 group-hover/item:text-purple-300 transition-colors">
                                                        {trend.name}
                                                    </h4>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cosmic-500"
                                                            style={{ width: `${Math.min(trend.overall_score || 0, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                            <span>{trend.mention_count} mentions</span>
                                                        </div>
                                                        <span className="text-lg font-black text-white">{safe(trend.overall_score)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>


                            {/* ── Pagination ────────────────────────────────── */}
                            {data && data.pages > 1 && (
                                <div className="flex justify-center items-center gap-4 py-8 border-t border-white/5">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={!data.has_prev}
                                        className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                                    >
                                        ← Previous
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                                            const pageNum = i + 1
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pageNum === data.page
                                                        ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                                                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        })}
                                        {data.pages > 7 && <span className="text-gray-500 px-1">...</span>}
                                    </div>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={!data.has_next}
                                        className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ═══════ TAB: EMERGING ══════════════════════════════════════ */}
            {activeTab === 'emerging' && (
                <>
                    {/* Controls */}
                    <div className="cosmic-card">
                        <div className="flex items-center gap-3 mb-4">
                            <Flame className="w-5 h-5 text-orange-400" />
                            <h3 className="text-lg font-extrabold text-white">Discovery Parameters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">Time Window</label>
                                <div className="flex gap-2">
                                    {[7, 14, 30].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setEmergingDays(d)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${emergingDays === d
                                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            {d}d
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">Min Growth %</label>
                                <input
                                    type="range"
                                    min="0" max="100" step="5"
                                    value={emergingMinGrowth}
                                    onChange={(e) => setEmergingMinGrowth(Number(e.target.value))}
                                    className="w-full accent-orange-500"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                    <span>0%</span>
                                    <span className="text-orange-400 font-bold">{emergingMinGrowth}%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {emergingLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-14 h-14 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                            <p className="text-gray-500 text-sm animate-pulse">Scanning for rising signals...</p>
                        </div>
                    ) : emergingData?.trends && emergingData.trends.length > 0 ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
                                <StatCard icon={Flame} label="Rising Trends" value={emergingData.trends.length} color="text-orange-400" />
                                <StatCard icon={Clock} label="Time Window" value={`${emergingData.days}d`} color="text-blue-400" />
                                <StatCard
                                    icon={ArrowUpRight}
                                    label="Avg Growth"
                                    value={`${(emergingData.trends.reduce((s: number, t: any) => s + t.growth_rate, 0) / emergingData.trends.length).toFixed(1)}%`}
                                    color="text-green-400"
                                />
                            </div>

                            {/* Growth Chart */}
                            <div className="cosmic-card">
                                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-3 text-green-400" />
                                    Growth Rate Comparison
                                </h3>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={emergingData.trends.map((t: any) => ({
                                            name: t.name.length > 12 ? t.name.substring(0, 10) + '..' : t.name,
                                            growth: t.growth_rate,
                                            score: t.current_score,
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-45} textAnchor="end" height={80} />
                                            <YAxis stroke="#6b7280" fontSize={11} />
                                            <Tooltip content={<CosmicTooltip />} />
                                            <Bar dataKey="growth" name="Growth %" radius={[4, 4, 0, 0]}>
                                                {emergingData.trends.map((_: any, idx: number) => (
                                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Emerging List */}
                            <div className="space-y-3 stagger-children">
                                {emergingData.trends.map((trend: any, index: number) => (
                                    <div
                                        key={trend.trend_id}
                                        className="cosmic-card !p-4 group cursor-pointer flex items-center gap-5 hover:!border-green-500/30"
                                        onClick={() => navigate(`/trends/${trend.trend_id}`)}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/20 flex items-center justify-center">
                                                <span className="text-lg font-black text-green-400">#{index + 1}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-bold text-white text-base group-hover:text-green-300 transition-colors truncate">
                                                    {trend.name}
                                                </h4>
                                                <span className="text-[10px] font-bold text-purple-400/70 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 uppercase shrink-0">
                                                    {trend.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                                                <span>Score: {safe(trend.current_score)}</span>
                                                <span>Change: {trend.score_change > 0 ? '+' : ''}{safe(trend.score_change)} pts</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xl font-black text-green-400">
                                                +{safe(trend.growth_rate)}%
                                            </p>
                                            <p className="text-[10px] text-gray-500">growth</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="cosmic-card text-center py-16">
                            <Flame className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold">No emerging trends found</p>
                            <p className="text-gray-500 text-sm mt-2">Try lowering the minimum growth threshold</p>
                        </div>
                    )}
                </>
            )}

            {/* ═══════ TAB: COMPARE ══════════════════════════════════════ */}
            {activeTab === 'compare' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Selection Panel */}
                        <div className="cosmic-card lg:col-span-1">
                            <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                                <Trophy className="w-5 h-5 mr-3 text-amber-400" />
                                Select Contenders
                            </h3>
                            <p className="text-[11px] text-gray-500 mb-3">Pick 2–10 technologies to compare side by side</p>

                            {/* Selected chips */}
                            {compareIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {compareIds.map(id => {
                                        const t = data?.items?.find(x => x.id === id)
                                        return (
                                            <div key={id} className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded-lg">
                                                <span className="text-xs font-bold text-white">{t?.name || id}</span>
                                                <button onClick={() => toggleCompare(id)} className="hover:bg-purple-500/30 rounded p-0.5">
                                                    <X className="w-3 h-3 text-purple-300" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    value={compareSearch}
                                    onChange={(e) => setCompareSearch(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar">
                                {compareFilteredTrends.map(trend => (
                                    <button
                                        key={trend.id}
                                        onClick={() => toggleCompare(trend.id)}
                                        disabled={compareIds.length >= 10}
                                        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-30"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Star className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                            <span className="text-sm font-bold text-white truncate">{trend.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 shrink-0 ml-2">{safe(trend.overall_score)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results Panel */}
                        <div className="lg:col-span-2 space-y-6">
                            {compareIds.length < 2 ? (
                                <div className="cosmic-card text-center py-20">
                                    <Trophy className="w-14 h-14 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold text-lg">Select at least 2 technologies</p>
                                    <p className="text-gray-500 text-sm mt-2">Use the panel on the left to add contenders</p>
                                </div>
                            ) : compareLoading ? (
                                <div className="cosmic-card flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                    <p className="text-gray-500 text-sm animate-pulse">Calculating battle metrics...</p>
                                </div>
                            ) : comparison ? (
                                <>
                                    {/* Winner Cards */}
                                    {comparison.metrics && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
                                            {comparison.metrics.highest_score && (
                                                <div className="cosmic-card !border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-transparent">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Crown className="w-5 h-5 text-yellow-400" />
                                                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Highest Score</span>
                                                    </div>
                                                    <p className="text-xl font-black text-white">{comparison.metrics.highest_score}</p>
                                                </div>
                                            )}
                                            {comparison.metrics.fastest_growing && (
                                                <div className="cosmic-card !border-green-500/20 bg-gradient-to-b from-green-500/5 to-transparent">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Rocket className="w-5 h-5 text-green-400" />
                                                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Fastest Growing</span>
                                                    </div>
                                                    <p className="text-xl font-black text-white">{comparison.metrics.fastest_growing}</p>
                                                </div>
                                            )}
                                            {comparison.metrics.most_mentioned && (
                                                <div className="cosmic-card !border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Most Mentioned</span>
                                                    </div>
                                                    <p className="text-xl font-black text-white">{comparison.metrics.most_mentioned}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Comparison Chart */}
                                    <div className="cosmic-card">
                                        <h3 className="text-lg font-extrabold text-white mb-6 flex items-center">
                                            <BarChart3 className="w-5 h-5 mr-3 text-cosmic-400" />
                                            Performance Breakdown
                                        </h3>
                                        <div className="h-[380px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={compareChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-30} textAnchor="end" height={70} />
                                                    <YAxis stroke="#6b7280" fontSize={11} />
                                                    <Tooltip content={<CosmicTooltip />} />
                                                    <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                                                    <Bar dataKey="overall_score" fill="#818cf8" name="Overall" radius={[3, 3, 0, 0]} />
                                                    <Bar dataKey="popularity_score" fill="#d946ef" name="Popularity" radius={[3, 3, 0, 0]} />
                                                    <Bar dataKey="growth_score" fill="#10b981" name="Growth" radius={[3, 3, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Detailed Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                                        {comparison.trends.map((trend, idx) => (
                                            <div
                                                key={trend.id}
                                                className="cosmic-card cursor-pointer hover:!border-purple-500/30"
                                                onClick={() => navigate(`/trends/${trend.id}`)}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-bold text-white">{trend.name}</h4>
                                                    <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                                                </div>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Overall', value: trend.overall_score, max: 100, color: '#818cf8' },
                                                        { label: 'Popularity', value: trend.popularity_score, max: 100, color: '#d946ef' },
                                                        { label: 'Growth', value: trend.growth_score, max: 100, color: '#10b981' },
                                                    ].map(m => (
                                                        <div key={m.label}>
                                                            <div className="flex justify-between text-[11px] mb-1">
                                                                <span className="text-gray-400">{m.label}</span>
                                                                <span className="font-bold text-white">{safe(m.value)}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-700"
                                                                    style={{ width: `${Math.min((m.value || 0) / (m.max || 1) * 100, 100)}%`, background: m.color }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[11px] text-gray-500">
                                                    <span>{trend.mention_count} mentions</span>
                                                    <span className="flex items-center gap-1 text-purple-400 font-bold">
                                                        View Details <ArrowRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
