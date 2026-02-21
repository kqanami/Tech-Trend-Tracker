import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { repositoriesAPI } from '../api/client'
import { Search, Star, GitFork, ExternalLink, Github, Code, Users } from 'lucide-react'

export default function Repositories() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [language, setLanguage] = useState('All')

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

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Header */}
            <div className="relative text-center py-6">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <Github className="w-12 h-12" />
                    Code Horizon
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto italic">Mapping the most influential codebases across the GitHub galaxy with deep-tech telemetry.</p>
            </div>

            {/* Filters */}
            <div className="cosmic-card glass-dark sticky top-4 z-20">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-nebula-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search code clusters..."
                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-nebula-500/50 focus:border-nebula-500/50 text-white placeholder-gray-500 transition-all font-medium"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                    <div className="relative group min-w-[200px]">
                        <Code className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <select
                            className="w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-nebula-500/50 text-white appearance-none transition-all font-medium cursor-pointer"
                            value={language}
                            onChange={(e) => {
                                setLanguage(e.target.value)
                                setPage(1)
                            }}
                        >
                            <option value="All">All Tech Stacks</option>
                            <option value="Python">Python Ops</option>
                            <option value="TypeScript">TypeScript Lab</option>
                            <option value="JavaScript">ECMAScript Base</option>
                            <option value="Go">Go Systems</option>
                            <option value="Rust">Rust Mesh</option>
                            <option value="C++">C++ Core</option>
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="w-16 h-16 border-4 border-nebula-500/30 border-t-nebula-500 rounded-full animate-spin shadow-nebula" />
                    <p className="text-nebula-400 font-bold animate-pulse">Scanning repository manifolds...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                        {data?.items.map((repo) => (
                            <div
                                key={repo.id}
                                className="cosmic-card flex flex-col group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-nebula-500/5 blur-3xl rounded-full" />

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 bg-nebula-500/10 text-nebula-300 text-[10px] font-extrabold uppercase tracking-widest rounded border border-nebula-500/20">
                                            {repo.language || 'Unknown Stack'}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                            {repo.stars.toLocaleString()}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-nebula-400 transition-colors line-clamp-1">
                                        {repo.full_name}
                                    </h2>

                                    <p className="text-sm text-gray-400 line-clamp-3 mb-6 leading-relaxed flex-1 italic">
                                        {repo.description || 'No project description available in the registry.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                <GitFork className="w-3 h-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Forks</span>
                                            </div>
                                            <div className="text-lg font-bold text-white">{repo.forks.toLocaleString()}</div>
                                        </div>
                                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                <Users className="w-3 h-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-tight">Issues</span>
                                            </div>
                                            <div className="text-lg font-bold text-white">{repo.open_issues.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1 flex-1 pr-10">
                                            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
                                                <span className="text-gray-500">Momentum Engine</span>
                                                <span className="text-nebula-400">{repo.trending_score.toFixed(1)} Pts</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-nebula-600 to-pink-500 opacity-80 transition-all duration-1000 shadow-nebula"
                                                    style={{ width: `${Math.min(repo.trending_score, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <a
                                            href={repo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-nebula-500/10 hover:bg-nebula-500/20 p-2.5 rounded-xl border border-nebula-500/30 text-nebula-400 transition-all hover:scale-110 shadow-lg"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Sector</span>
                                <span className="text-nebula-400 font-black text-lg">{data.page}</span>
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
