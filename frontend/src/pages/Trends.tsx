import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trendsAPI } from '../api/client'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Search, Activity, BarChart3, Zap, ArrowRight, Sparkles } from 'lucide-react'
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip,
} from 'recharts'

export default function Trends() {
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')

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
        refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    })

    // Prepare data for radar chart (top 6 trends)
    const chartData = data?.items.slice(0, 6).map((trend) => ({
        subject: trend.name.length > 12 ? trend.name.substring(0, 10) + '..' : trend.name,
        A: trend.overall_score,
        fullMark: 100,
    })) || []

    return (
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
            {/* Header */}
            <div className="relative text-center py-6">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <Zap className="w-12 h-12 text-purple-500 animate-pulse" />
                    Signal Analysis
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto italic">Quantifying emerging technology clusters and phase shifts across the multiverse.</p>
            </div>

            <div className="cosmic-card glass-dark sticky top-4 z-20">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter trend signals..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-500 transition-all font-medium"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                    <div className="relative group min-w-[200px]">
                        <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <select
                            className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white appearance-none transition-all font-medium cursor-pointer"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value)
                                setPage(1)
                            }}
                        >
                            <option value="All">All Domains</option>
                            <option value="AI">AI Frameworks</option>
                            <option value="Cloud">Cloud Infra</option>
                            <option value="Crypto">DeFi & Web3</option>
                            <option value="Web">UX & Frontend</option>
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
                    <p className="text-purple-400 font-bold animate-pulse">Calculating vector trajectories...</p>
                </div>
            ) : (
                <>
                    {/* Comparison View */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="cosmic-card h-[500px] flex flex-col group overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-xl font-extrabold text-white mb-8 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-3 text-purple-400" />
                                Sector Performance Matrix
                            </h3>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} />
                                        <Radar
                                            name="Velocity"
                                            dataKey="A"
                                            stroke="#a855f7"
                                            fill="#a855f7"
                                            fillOpacity={0.2}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 15, 30, 0.95)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                backdropFilter: 'blur(10px)',
                                            }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="cosmic-card h-[500px] flex flex-col group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cosmic-500 to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-xl font-extrabold text-white mb-8 flex items-center sticky top-0 bg-transparent py-2 z-10">
                                <Activity className="w-5 h-5 mr-3 text-cosmic-400" />
                                Ranked Velocity
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                {data?.items.map((trend, index) => (
                                    <div
                                        key={trend.id}
                                        className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group/item cursor-pointer"
                                        onClick={() => navigate(`/trends/${trend.id}`)}
                                    >
                                        <div className="text-3xl font-black text-white/5 group-hover/item:text-purple-500/20 transition-colors w-12 shrink-0 italic">
                                            {String((page - 1) * 20 + index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-white text-lg group-hover/item:text-purple-300 transition-colors">{trend.name}</h4>
                                                <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20 uppercase tracking-tighter">
                                                    {trend.overall_score.toFixed(1)} Pts
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cosmic-500 transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                                    style={{ width: `${trend.overall_score}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>{trend.mention_count} mentions</span>
                                                <span>•</span>
                                                <span>{trend.category}</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover/item:text-purple-400 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    {data && data.pages > 1 && (
                        <div className="flex justify-center items-center gap-6 py-12 border-t border-white/5">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!data.has_prev}
                                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Dimension</span>
                                <span className="text-purple-400 font-black text-lg">{data.page}</span>
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">of {data.pages}</span>
                            </div>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!data.has_next}
                                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-all font-bold text-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
