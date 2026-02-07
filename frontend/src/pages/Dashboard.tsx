import { useQuery } from '@tanstack/react-query'
import { dashboardAPI } from '../api/client'
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
    LineChart,
    Line,
} from 'recharts'
import { TrendingUp, Newspaper, Github, Tag, Activity } from 'lucide-react'

const COLORS = ['#6366f1', '#d946ef', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export default function Dashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await dashboardAPI.getStats()
            return response.data
        },
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-bold gradient-text animate-float">
                    Tech Trend Tracker
                </h1>
                <p className="text-xl text-gray-300">
                    Discover the latest technology trends from across the universe 🌌
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.name}
                            className="cosmic-card group cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400 font-medium">{stat.name}</p>
                                    <p className="text-3xl font-bold text-white mt-2">
                                        {stat.value.toLocaleString()}
                                    </p>
                                    {stat.today !== undefined && stat.today > 0 && (
                                        <p className="text-sm text-green-400 mt-1 flex items-center">
                                            <Activity className="w-4 h-4 mr-1" />
                                            +{stat.today} today
                                        </p>
                                    )}
                                </div>
                                <div className={`p-4 rounded-lg bg-${stat.color}-500/10 group-hover:bg-${stat.color}-500/20 transition-colors`}>
                                    <Icon className={`w-8 h-8 text-${stat.color}-400`} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Sources */}
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                        <Newspaper className="w-5 h-5 mr-2 text-cosmic-400" />
                        Top Sources
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats?.top_sources || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a2e',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                }}
                            />
                            <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Languages */}
                <div className="cosmic-card">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                        <Github className="w-5 h-5 mr-2 text-nebula-400" />
                        Top Programming Languages
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats?.top_languages || []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {stats?.top_languages.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a2e',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Trending Now */}
            <div className="cosmic-card">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-cosmic-400" />
                    Trending Now
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats?.trending_now.slice(0, 6).map((trend) => (
                        <div
                            key={trend.id}
                            className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10 group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-white group-hover:text-cosmic-300 transition-colors">
                                    {trend.name}
                                </h4>
                                <span className="text-xs bg-cosmic-500/20 text-cosmic-300 px-2 py-1 rounded-full">
                                    {trend.category}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{trend.description || 'No description'}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{trend.mention_count} mentions</span>
                                <span className="text-cosmic-400 font-semibold">
                                    Score: {trend.overall_score.toFixed(1)}
                                </span>
                            </div>
                            {/* Score bar */}
                            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cosmic-gradient"
                                    style={{ width: `${trend.overall_score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
