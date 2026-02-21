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
} from 'recharts'
import { TrendingUp, Newspaper, Github, Tag, Activity, Share2, Sparkles, BarChart3, Zap, ArrowRight } from 'lucide-react'
import KnowledgeGraph from '../components/KnowledgeGraph'

const COLORS = ['#6366f1', '#d946ef', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export default function Dashboard() {
    const navigate = useNavigate()
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await dashboardAPI.getStats()
            return response.data
        },
        refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-16 h-16 border-4 border-cosmic-500 border-t-transparent rounded-full spinner" />
            </div>
        )
    }

    const statCards = [
        {
            name: 'Total Articles',
            value: stats?.total_articles || 0,
            icon: Newspaper,
            color: 'cosmic',
            today: stats?.articles_today || 0,
        },
        {
            name: 'Repositories',
            value: stats?.total_repos || 0,
            icon: Github,
            color: 'nebula',
            today: stats?.repos_today || 0,
        },
        {
            name: 'Trends',
            value: stats?.total_trends || 0,
            icon: TrendingUp,
            color: 'purple',
        },
        {
            name: 'Tags',
            value: stats?.total_tags || 0,
            icon: Tag,
            color: 'blue',
        },
    ]

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center relative py-10">
                <div className="absolute inset-0 bg-cosmic-glow blur-3xl opacity-30 -z-10" />
                <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight gradient-text animate-float">
                    Tech Trend Tracker
                </h1>
                <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                    Exploring the digital frontier. Discover the pulse of global technology trends in real-time. 🌠
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.name}
                            className="cosmic-card h-full flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">{stat.name}</p>
                                    <p className="text-4xl font-bold text-white mt-3 tracking-tight">
                                        {stat.value.toLocaleString()}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 ring-1 ring-${stat.color}-500/20`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                            {stat.today !== undefined && stat.today > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-xs text-green-400 flex items-center font-semibold">
                                        <Activity className="w-3 h-3 mr-1.5" />
                                        +{stat.today} expanded today
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Sources */}
                <div className="cosmic-card overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center text-white">
                            <Newspaper className="w-5 h-5 mr-3 text-cosmic-400" />
                            Intelligence Sources
                        </h3>
                    </div>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.top_sources || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 15, 30, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                    }}
                                />
                                <Bar dataKey="count" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Languages */}
                <div className="cosmic-card">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center text-white">
                            <Github className="w-5 h-5 mr-3 text-nebula-400" />
                            Language Ecosystems
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.top_languages || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {stats?.top_languages.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 15, 30, 0.95)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Trending Now */}
            <div className="space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-bold flex items-center text-white">
                        <TrendingUp className="w-8 h-8 mr-4 text-cosmic-400" />
                        Trending Horizons
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats?.trending_now.slice(0, 6).map((trend) => (
                        <div
                            key={trend.id}
                            className="cosmic-card p-0 overflow-hidden flex flex-col cursor-pointer group hover:scale-[1.02] transition-transform"
                            onClick={() => navigate(`/trends/${trend.id}`)}
                        >
                            <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-cosmic-400 border border-cosmic-500/30 px-2 py-1 rounded bg-cosmic-500/10">
                                        {trend.category}
                                    </span>
                                    <span className="text-xl font-black text-white/20">#{(stats?.trending_now.indexOf(trend) || 0) + 1}</span>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-cosmic-400 transition-colors">
                                    {trend.name}
                                </h4>
                                <p className="text-sm text-gray-400 mb-6 leading-relaxed line-clamp-2">
                                    {trend.description || 'Monitoring emerging patterns in this technology sector.'}
                                </p>
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                    <span>{trend.mention_count} Signal Pulls</span>
                                    <span className="text-cosmic-400">Score {trend.overall_score.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="h-1 bg-white/5 relative">
                                <div
                                    className="absolute inset-y-0 left-0 bg-premium-gradient shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${trend.overall_score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                    onClick={() => navigate('/emerging')}
                    className="cosmic-card cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Zap className="w-8 h-8 text-green-400" />
                        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Emerging Trends</h3>
                    <p className="text-sm text-gray-400 mb-4">Discover the fastest-growing technologies right now</p>
                    <div className="text-xs text-green-400 font-bold">Explore →</div>
                </div>

                <div
                    onClick={() => navigate('/compare')}
                    className="cosmic-card cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                    <div className="flex items-center justify-between mb-4">
                        <BarChart3 className="w-8 h-8 text-purple-400" />
                        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Compare Technologies</h3>
                    <p className="text-sm text-gray-400 mb-4">Side-by-side comparison of up to 10 trends</p>
                    <div className="text-xs text-purple-400 font-bold">Compare →</div>
                </div>

                <div
                    onClick={() => navigate('/recommendations')}
                    className="cosmic-card cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Sparkles className="w-8 h-8 text-nebula-400" />
                        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-nebula-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Recommendations</h3>
                    <p className="text-sm text-gray-400 mb-4">Personalized trend suggestions based on your interests</p>
                    <div className="text-xs text-nebula-400 font-bold">Get Recommendations →</div>
                </div>

                <div
                    onClick={() => navigate('/statistics')}
                    className="cosmic-card cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                    <div className="flex items-center justify-between mb-4">
                        <Activity className="w-8 h-8 text-blue-400" />
                        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Advanced Statistics</h3>
                    <p className="text-sm text-gray-400 mb-4">Deep insights and analytics</p>
                    <div className="text-xs text-blue-400 font-bold">View Stats →</div>
                </div>
            </div>

            {/* Knowledge Graph Galaxy */}
            <div className="pb-20">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold flex items-center text-white">
                        <Share2 className="w-8 h-8 mr-4 text-cosmic-400" />
                        Technology Galaxy
                    </h3>
                </div>
                <KnowledgeGraph />
            </div>

        </div>
    )
}
