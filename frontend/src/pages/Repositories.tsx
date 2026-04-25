import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { repositoriesAPI } from '../api/client'
import {
    Search, Star, GitFork, ExternalLink, Github, Code, Users,
    TrendingUp, Flame, Eye, Layers, BarChart3, Zap, ArrowUpRight,
    AlertCircle, Filter, Crown, Medal, Award
} from 'lucide-react'
import { NoResults } from '../components/EmptyState'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    PieChart,
    Pie,
    Legend,
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
    Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a', Go: '#00ADD8',
    Rust: '#dea584', 'C++': '#f34b7d', Java: '#b07219', Ruby: '#701516',
    Swift: '#F05138', Kotlin: '#A97BFF', C: '#555555', Shell: '#89e051',
    Dart: '#00B4AB', PHP: '#4F5D95', Scala: '#c22d40', Zig: '#ec915c',
}
const CHART_COLORS = ['#818cf8', '#d946ef', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899']

const CosmicTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-space-950/95 border border-white/10 backdrop-blur-xl rounded-xl p-3 shadow-2xl">
            <p className="text-xs text-gray-400 font-bold mb-1">{label}</p>
            {payload.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: e.color || e.fill }} />
                    <span className="text-gray-300">{e.name}:</span>
                    <span className="font-bold text-white">{typeof e.value === 'number' ? e.value.toLocaleString() : e.value}</span>
                </div>
            ))}
        </div>
    )
}

// ── Category Pill ─────────────────────────────────────────────────────────────
function LangPill({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap border ${active
                ? 'bg-nebula-500/20 text-nebula-300 border-nebula-500/40 shadow-[0_0_12px_rgba(217,70,239,0.15)]'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200'
                }`}
        >
            {color && <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
            {label}
        </button>
    )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-nebula-400' }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
    return (
        <div className="cosmic-card group">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            {sub && <p className="text-[10px] text-gray-500 mt-1">{sub}</p>}
        </div>
    )
}

// ── Podium Card ───────────────────────────────────────────────────────────────
function RepoPodium({ repo, rank }: { repo: any; rank: number }) {
    const icons = [Crown, Medal, Award]
    const Icon = icons[rank] || Award
    const colors = [
        { ring: 'ring-yellow-500/30', bg: 'from-yellow-500/15 to-amber-500/5', text: 'text-yellow-400', glow: 'shadow-[0_0_25px_rgba(234,179,8,0.15)]' },
        { ring: 'ring-gray-400/30', bg: 'from-gray-400/10 to-gray-500/5', text: 'text-gray-300', glow: '' },
        { ring: 'ring-amber-600/30', bg: 'from-amber-600/10 to-orange-500/5', text: 'text-amber-500', glow: '' },
    ]
    const c = colors[rank] || colors[2]
    const langColor = LANG_COLORS[repo.language] || '#6b7280'

    return (
        <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`cosmic-card group bg-gradient-to-b ${c.bg} ring-1 ${c.ring} ${c.glow} flex flex-col hover:scale-[1.02] transition-all duration-300`}
        >
            <div className="flex items-center justify-between mb-3">
                <Icon className={`w-7 h-7 ${c.text}`} />
                <div className="flex items-center gap-1.5">
                    {repo.language && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: langColor }} />
                            {repo.language}
                        </span>
                    )}
                </div>
            </div>
            <h3 className="text-lg font-extrabold text-white mb-1 group-hover:text-nebula-300 transition-colors line-clamp-1">
                {repo.full_name}
            </h3>
            <p className="text-[11px] text-gray-400 line-clamp-2 mb-4 leading-relaxed flex-1">
                {repo.description || 'No description available.'}
            </p>
            <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 font-bold text-yellow-400">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    {repo.stars.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                    <GitFork className="w-3.5 h-3.5" />
                    {repo.forks.toLocaleString()}
                </span>
                {repo.stars_today != null && repo.stars_today > 0 && (
                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                        <TrendingUp className="w-3 h-3" />
                        +{repo.stars_today} today
                    </span>
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-bold uppercase tracking-widest">Trending</span>
                    <span className="text-nebula-400 font-black">{repo.trending_score?.toFixed(1) || '0.0'} pts</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-nebula-600 to-pink-500 transition-all duration-1000 shadow-[0_0_8px_rgba(217,70,239,0.3)]"
                        style={{ width: `${Math.min(repo.trending_score || 0, 100)}%` }}
                    />
                </div>
            </div>
        </a>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Repositories() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [language, setLanguage] = useState('All')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const { data, isLoading } = useQuery({
        queryKey: ['repositories', page, search, language],
        queryFn: async () => {
            const response = await repositoriesAPI.getAll({
                page,
                page_size: 12,
                search: search || undefined,
                language: language === 'All' ? undefined : language,
            })
            return response.data
        },
    })

    const languages = ['All', 'Python', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'C++', 'Java', 'Ruby', 'Swift']

    const stats = useMemo(() => {
        if (!data?.items?.length) return null
        const items = data.items
        const totalStars = items.reduce((s, r) => s + (r.stars || 0), 0)
        const totalForks = items.reduce((s, r) => s + (r.forks || 0), 0)
        const avgTrending = items.reduce((s, r) => s + (r.trending_score || 0), 0) / items.length
        const langMap = new Map<string, number>()
        items.forEach(r => { if (r.language) langMap.set(r.language, (langMap.get(r.language) || 0) + 1) })
        const topLang = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1])[0]
        return { totalStars, totalForks, avgTrending, topLang: topLang?.[0] || 'N/A', total: data.total }
    }, [data])

    // Language distribution for pie chart
    const langDistribution = useMemo(() => {
        if (!data?.items) return []
        const map = new Map<string, number>()
        data.items.forEach(r => {
            const l = r.language || 'Unknown'
            map.set(l, (map.get(l) || 0) + 1)
        })
        return Array.from(map.entries()).map(([name, value]) => ({ name, value, fill: LANG_COLORS[name] || '#6b7280' }))
    }, [data])

    // Top repos by stars for bar chart
    const starsChartData = useMemo(() =>
        data?.items?.slice(0, 8).map(r => ({
            name: r.name?.length > 12 ? r.name.substring(0, 10) + '..' : r.name,
            stars: r.stars,
            forks: r.forks,
        })) || [],
        [data]
    )

    const top3 = page === 1 && !search && language === 'All' ? data?.items?.slice(0, 3) || [] : []
    const restItems = top3.length ? data?.items?.slice(3) : data?.items

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* ── Hero Header ──────────────────────────────────────────── */}
            <div className="relative text-center py-8">
                <div className="absolute inset-0 bg-gradient-to-b from-nebula-500/5 to-transparent rounded-3xl" />
                <div className="relative">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="relative">
                            <Github className="w-12 h-12 text-nebula-400" />
                            <div className="absolute inset-0 blur-xl bg-nebula-500/30 animate-pulse" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text tracking-tight">
                            Code Horizon
                        </h1>
                    </div>
                    <p className="text-gray-400 font-light max-w-2xl mx-auto text-sm md:text-base">
                        Mapping the most influential open-source codebases across the GitHub galaxy with deep-tech telemetry.
                    </p>
                </div>
            </div>

            {/* ── Stats Row ────────────────────────────────────────────── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
                    <StatCard icon={Layers} label="Total Repos" value={stats.total} color="text-nebula-400" />
                    <StatCard icon={Star} label="Total Stars" value={stats.totalStars.toLocaleString()} color="text-yellow-400" />
                    <StatCard icon={GitFork} label="Total Forks" value={stats.totalForks.toLocaleString()} color="text-blue-400" />
                    <StatCard icon={TrendingUp} label="Avg Trending" value={stats.avgTrending.toFixed(1)} color="text-green-400" />
                    <StatCard icon={Code} label="Top Language" value={stats.topLang} color="text-purple-400" />
                </div>
            )}

            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="cosmic-card glass-dark space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-nebula-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search repositories, owners, descriptions..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-white placeholder-gray-500 transition-all font-medium"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-nebula-500/20 border-nebula-500/40 text-nebula-300' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
                        >
                            <Layers className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-lg border transition-all ${viewMode === 'list' ? 'bg-nebula-500/20 border-nebula-500/40 text-nebula-300' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Code className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mr-1">Language:</span>
                    {languages.map(l => (
                        <LangPill key={l} label={l} active={language === l} color={LANG_COLORS[l]} onClick={() => { setLanguage(l); setPage(1) }} />
                    ))}
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="cosmic-card animate-pulse flex flex-col gap-4 h-[280px]">
                            <div className="flex justify-between"><div className="h-5 w-20 rounded-full bg-white/5" /><div className="h-5 w-14 bg-white/5 rounded" /></div>
                            <div className="h-6 w-3/4 bg-white/5 rounded" />
                            <div className="h-4 w-full bg-white/5 rounded" />
                            <div className="h-4 w-4/5 bg-white/5 rounded" />
                            <div className="h-2 w-full bg-white/5 rounded-full mt-auto" />
                        </div>
                    ))}
                </div>
            ) : data?.items?.length === 0 ? (
                <NoResults onReset={() => { setSearch(''); setLanguage('All') }} />
            ) : (
                <>
                    {/* ── Top 3 Podium ──────────────────────────────── */}
                    {top3.length >= 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
                            {top3.map((repo, i) => <RepoPodium key={repo.id} repo={repo} rank={i} />)}
                        </div>
                    )}

                    {/* ── Charts Row ────────────────────────────────── */}
                    {page === 1 && !search && language === 'All' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Stars Bar Chart */}
                            <div className="cosmic-card lg:col-span-2 group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nebula-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                                    <Star className="w-5 h-5 mr-3 text-yellow-400" />
                                    Stars & Forks Breakdown
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={starsChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                                            <YAxis stroke="#6b7280" fontSize={11} />
                                            <Tooltip content={<CosmicTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            <Bar dataKey="stars" name="Stars" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                            <Bar dataKey="forks" name="Forks" fill="#818cf8" radius={[3, 3, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Language Pie */}
                            <div className="cosmic-card group overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-lg font-extrabold text-white mb-4 flex items-center">
                                    <Code className="w-5 h-5 mr-3 text-purple-400" />
                                    Language Mix
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={langDistribution}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius="70%"
                                                innerRadius="45%"
                                                paddingAngle={3}
                                                strokeWidth={0}
                                            >
                                                {langDistribution.map((entry, idx) => (
                                                    <Cell key={idx} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CosmicTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: 10 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Repository Grid/List ──────────────────────── */}
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                            {(restItems || []).map((repo) => {
                                const langColor = LANG_COLORS[repo.language] || '#6b7280'
                                return (
                                    <div key={repo.id} className="cosmic-card !p-0 flex flex-col group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-nebula-500/5 blur-3xl rounded-full pointer-events-none" />

                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-nebula-500/10 border border-nebula-500/20 rounded-full text-[10px] font-bold text-nebula-300 uppercase tracking-wider">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: langColor }} />
                                                    {repo.language || 'Unknown'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                    {repo.stars.toLocaleString()}
                                                </div>
                                            </div>

                                            <h2 className="text-base font-bold text-white mb-1.5 leading-tight group-hover:text-nebula-400 transition-colors line-clamp-1">
                                                {repo.full_name}
                                            </h2>

                                            <p className="text-[11px] text-gray-400 line-clamp-3 mb-4 leading-relaxed flex-1">
                                                {repo.description || 'No project description available.'}
                                            </p>

                                            {/* Mini stats */}
                                            <div className="grid grid-cols-3 gap-2 mb-4">
                                                <div className="p-2 bg-white/5 border border-white/5 rounded-lg text-center">
                                                    <GitFork className="w-3 h-3 text-gray-500 mx-auto mb-0.5" />
                                                    <div className="text-xs font-bold text-white">{repo.forks.toLocaleString()}</div>
                                                    <div className="text-[8px] text-gray-500 uppercase">Forks</div>
                                                </div>
                                                <div className="p-2 bg-white/5 border border-white/5 rounded-lg text-center">
                                                    <AlertCircle className="w-3 h-3 text-gray-500 mx-auto mb-0.5" />
                                                    <div className="text-xs font-bold text-white">{repo.open_issues.toLocaleString()}</div>
                                                    <div className="text-[8px] text-gray-500 uppercase">Issues</div>
                                                </div>
                                                <div className="p-2 bg-white/5 border border-white/5 rounded-lg text-center">
                                                    <Flame className="w-3 h-3 text-gray-500 mx-auto mb-0.5" />
                                                    <div className="text-xs font-bold text-white">{repo.stars_today || 0}</div>
                                                    <div className="text-[8px] text-gray-500 uppercase">Today</div>
                                                </div>
                                            </div>

                                            {/* Topics */}
                                            {repo.topics && repo.topics.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {repo.topics.slice(0, 4).map((topic: string) => (
                                                        <span key={topic} className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] text-gray-500 font-bold">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                    {repo.topics.length > 4 && (
                                                        <span className="text-[9px] text-gray-500">+{repo.topics.length - 4}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="px-5 pb-5 pt-0">
                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <div className="flex-1 pr-4">
                                                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest mb-1">
                                                        <span className="text-gray-500">Momentum</span>
                                                        <span className="text-nebula-400">{repo.trending_score?.toFixed(1) || '0.0'}</span>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-nebula-600 to-pink-500 rounded-full transition-all duration-1000 shadow-nebula"
                                                            style={{ width: `${Math.min(repo.trending_score || 0, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <a
                                                    href={repo.url} target="_blank" rel="noopener noreferrer"
                                                    className="bg-nebula-500/15 hover:bg-nebula-500/25 p-2 rounded-lg border border-nebula-500/30 text-nebula-400 transition-all hover:scale-110"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        /* ── List view ─────────────────────────────────── */
                        <div className="space-y-3 stagger-children">
                            {(restItems || []).map((repo, index) => {
                                const langColor = LANG_COLORS[repo.language] || '#6b7280'
                                const rank = top3.length ? index + 4 : (page - 1) * 12 + index + 1
                                return (
                                    <a
                                        key={repo.id}
                                        href={repo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="cosmic-card !p-4 group/item flex items-center gap-5 hover:!border-nebula-500/30"
                                    >
                                        <div className="text-2xl font-black text-white/5 group-hover/item:text-nebula-500/20 transition-colors w-10 text-center shrink-0">
                                            {String(rank).padStart(2, '0')}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: langColor }} />
                                            <span className="text-[10px] font-bold text-gray-400">{repo.language || '?'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-white text-sm group-hover/item:text-nebula-300 transition-colors truncate">
                                                {repo.full_name}
                                            </h4>
                                            <p className="text-[11px] text-gray-500 truncate">{repo.description}</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />{repo.stars.toLocaleString()}</span>
                                            <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repo.forks.toLocaleString()}</span>
                                            <span className="font-bold text-nebula-400">{repo.trending_score?.toFixed(1)}</span>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover/item:text-nebula-400 transition-colors shrink-0" />
                                    </a>
                                )
                            })}
                        </div>
                    )}

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
                                                ? 'bg-nebula-500/30 text-nebula-300 border border-nebula-500/40'
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
        </div>
    )
}
