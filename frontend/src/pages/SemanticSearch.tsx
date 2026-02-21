
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchAPI } from '../api/client'
import { Search, Sparkles, ArrowRight, Loader, Zap, Filter } from 'lucide-react'
import { format } from 'date-fns'

const SemanticSearch = () => {
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [searchMode, setSearchMode] = useState<'vector' | 'hybrid'>('hybrid')
    const [vectorWeight, setVectorWeight] = useState(0.7)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query)
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    const { data: vectorResults, isLoading: isLoadingVector } = useQuery({
        queryKey: ['semantic-search', debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 3) return []
            const response = await searchAPI.vectorSearch(debouncedQuery)
            return response.data
        },
        enabled: debouncedQuery.length >= 3 && searchMode === 'vector',
    })

    const { data: hybridResults, isLoading: isLoadingHybrid } = useQuery({
        queryKey: ['hybrid-search', debouncedQuery, vectorWeight],
        queryFn: async () => {
            if (debouncedQuery.length < 3) return null
            const response = await searchAPI.hybridSearch(debouncedQuery, 10, vectorWeight, 1 - vectorWeight)
            return response.data
        },
        enabled: debouncedQuery.length >= 3 && searchMode === 'hybrid',
    })

    const isLoading = searchMode === 'vector' ? isLoadingVector : isLoadingHybrid
    const results = searchMode === 'vector' ? vectorResults : hybridResults?.combined_results || []

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-cosmic-400" />
                    Semantic Intelligence
                </h1>
                <p className="text-gray-400">
                    Search using natural language. Our AI understands context, not just keywords.
                </p>
            </div>

            {/* Search Bar */}
            <div className="space-y-4">
                <div className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className={`w-5 h-5 ${isLoading ? 'text-cosmic-400 animate-pulse' : 'text-gray-500'}`} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. 'How does quantum computing affect cryptography?'"
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl 
                                 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cosmic-500/50
                                 backdrop-blur-sm transition-all text-lg shadow-lg shadow-black/20"
                    />
                    {isLoading && (
                        <div className="absolute inset-y-0 right-4 flex items-center">
                            <Loader className="w-5 h-5 text-cosmic-400 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Search Options */}
                <div className="flex items-center gap-4 max-w-2xl">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400">Mode:</span>
                    </div>
                    <button
                        onClick={() => setSearchMode('vector')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            searchMode === 'vector'
                                ? 'bg-cosmic-500/20 border border-cosmic-500/50 text-cosmic-300'
                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        Semantic Only
                    </button>
                    <button
                        onClick={() => setSearchMode('hybrid')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            searchMode === 'hybrid'
                                ? 'bg-cosmic-500/20 border border-cosmic-500/50 text-cosmic-300'
                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                        <Zap className="w-4 h-4 inline mr-2" />
                        Hybrid
                    </button>
                    {searchMode === 'hybrid' && (
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500">Vector:</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={vectorWeight}
                                onChange={(e) => setVectorWeight(Number(e.target.value))}
                                className="w-24"
                            />
                            <span className="text-xs text-gray-400 w-8">{(vectorWeight * 100).toFixed(0)}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 gap-6">
                {searchMode === 'hybrid' && hybridResults && (
                    <div className="text-sm text-gray-400 mb-2">
                        Found {hybridResults.combined_results.length} results
                        {hybridResults.vector_results.length > 0 && ` (${hybridResults.vector_results.length} semantic, ${hybridResults.keyword_results.length} keyword)`}
                    </div>
                )}
                {results?.map((article: any) => (
                    <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group cosmic-card p-6 border-l-4 border-l-transparent hover:border-l-cosmic-500 transition-all"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs">
                                        {article.source}
                                    </span>
                                    <span>•</span>
                                    {article.published_at && (
                                        <span>{format(new Date(article.published_at), 'MMM d, yyyy')}</span>
                                    )}
                                    {article.category && (
                                        <>
                                            <span>•</span>
                                            <span className="text-cosmic-300">{article.category}</span>
                                        </>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white group-hover:text-cosmic-300 transition-colors">
                                    {article.title}
                                </h3>

                                <p className="text-gray-400 leading-relaxed line-clamp-2">
                                    {article.summary}
                                </p>

                                {article.technical_analysis && (
                                    <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-cosmic-400 mb-2 uppercase tracking-wider">
                                            <Sparkles className="w-3 h-3" />
                                            AI Analysis
                                        </div>
                                        <p className="text-sm text-gray-300 italic">
                                            "{article.technical_analysis}"
                                        </p>
                                    </div>
                                )}

                                {searchMode === 'hybrid' && article.combined_score !== undefined && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        Relevance: {(article.combined_score * 100).toFixed(0)}% • {article.type}
                                    </div>
                                )}
                            </div>

                            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-cosmic-400 transform group-hover:translate-x-1 transition-all ml-4 mt-2" />
                        </div>
                    </a>
                ))}

                {debouncedQuery.length >= 3 && results?.length === 0 && !isLoading && (
                    <div className="text-center py-20 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No matching intelligence found.</p>
                        <p className="text-sm">Try exploring different concepts or terminology.</p>
                    </div>
                )}

                {debouncedQuery.length < 3 && (
                    <div className="text-center py-20 text-gray-600">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20 text-cosmic-500" />
                        <p className="text-lg">Enter a query to explore the knowledge base.</p>
                        <p className="text-sm">Our vector engine will find conceptually related content.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SemanticSearch
