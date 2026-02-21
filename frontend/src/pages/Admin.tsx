import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, RefreshCw, Database, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import axios from '../api/client'

interface ScrapeResponse {
    message: string
    articles_count?: number
    repos_count?: number
}

export default function AdminPanel() {
    const [scrapeStatus, setScrapeStatus] = useState<string>('')
    const queryClient = useQueryClient()

    // Scrape mutation
    const scrapeMutation = useMutation({
        mutationFn: async (source: string) => {
            const response = await axios.post<ScrapeResponse>('/scrape', {
                source,
                limit: 20
            })
            return response.data
        },
        onSuccess: (data) => {
            setScrapeStatus(`✅ ${data.message}`)
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
            queryClient.invalidateQueries({ queryKey: ['articles'] })
            queryClient.invalidateQueries({ queryKey: ['repositories'] })
            setTimeout(() => setScrapeStatus(''), 5000)
        },
        onError: (error: any) => {
            setScrapeStatus(`❌ Error: ${error.response?.data?.detail || error.message}`)
            setTimeout(() => setScrapeStatus(''), 5000)
        }
    })

    const handleScrape = (source: string) => {
        setScrapeStatus(`⏳ Scraping ${source}...`)
        scrapeMutation.mutate(source)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold gradient-text">Admin Panel</h1>
                <p className="text-gray-400">Manage data collection and system operations</p>
            </div>

            {/* Status Message */}
            {scrapeStatus && (
                <div className={`cosmic-card ${scrapeStatus.includes('✅') ? 'border-green-500/50' : scrapeStatus.includes('❌') ? 'border-red-500/50' : 'border-cosmic-500/50'}`}>
                    <div className="flex items-center gap-3">
                        {scrapeStatus.includes('⏳') && <Loader2 className="w-5 h-5 animate-spin text-cosmic-400" />}
                        {scrapeStatus.includes('✅') && <CheckCircle className="w-5 h-5 text-green-400" />}
                        {scrapeStatus.includes('❌') && <AlertCircle className="w-5 h-5 text-red-400" />}
                        <p className="text-white font-medium">{scrapeStatus}</p>
                    </div>
                </div>
            )}

            {/* Data Collection Section */}
            <div className="cosmic-card">
                <div className="flex items-center gap-3 mb-6">
                    <Database className="w-6 h-6 text-cosmic-400" />
                    <h2 className="text-2xl font-bold text-white">Data Collection</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* TechCrunch Scraper */}
                    <button
                        onClick={() => handleScrape('techcrunch')}
                        disabled={scrapeMutation.isPending}
                        className="group relative overflow-hidden p-6 rounded-xl bg-gradient-to-br from-cosmic-500/20 to-purple-500/20 border border-cosmic-500/30 hover:border-cosmic-400 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-cosmic-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Play className="w-8 h-8 text-cosmic-400" />
                                <span className="text-xs bg-cosmic-500/20 text-cosmic-300 px-2 py-1 rounded-full">
                                    Articles
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Scrape TechCrunch</h3>
                            <p className="text-sm text-gray-400">
                                Collect latest tech news and articles
                            </p>
                        </div>
                    </button>

                    {/* GitHub Scraper */}
                    <button
                        onClick={() => handleScrape('github')}
                        disabled={scrapeMutation.isPending}
                        className="group relative overflow-hidden p-6 rounded-xl bg-gradient-to-br from-nebula-500/20 to-pink-500/20 border border-nebula-500/30 hover:border-nebula-400 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-nebula-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Play className="w-8 h-8 text-nebula-400" />
                                <span className="text-xs bg-nebula-500/20 text-nebula-300 px-2 py-1 rounded-full">
                                    Repos
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Scrape GitHub</h3>
                            <p className="text-sm text-gray-400">
                                Fetch trending repositories
                            </p>
                        </div>
                    </button>

                    {/* All Sources */}
                    <button
                        onClick={() => handleScrape('all')}
                        disabled={scrapeMutation.isPending}
                        className="group relative overflow-hidden p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 hover:border-green-400 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <RefreshCw className="w-8 h-8 text-green-400" />
                                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                                    All
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Scrape All</h3>
                            <p className="text-sm text-gray-400">
                                Collect from all sources
                            </p>
                        </div>
                    </button>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-300">
                            <p className="font-semibold text-blue-300 mb-1">Automatic Collection</p>
                            <p>Celery tasks automatically scrape data every 6 hours. Manual scraping is useful for immediate updates.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Celery Status */}
                <div className="cosmic-card">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-cosmic-400" />
                        <h3 className="text-xl font-bold text-white">Background Tasks</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Celery Worker</span>
                            <span className="text-green-400 text-sm">● Active</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <span className="text-gray-300">Celery Beat</span>
                            <span className="text-green-400 text-sm">● Scheduling</span>
                        </div>
                        <a
                            href="http://localhost:5555"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center px-4 py-2 bg-cosmic-500/20 hover:bg-cosmic-500/30 border border-cosmic-500/50 rounded-lg text-cosmic-300 hover:text-cosmic-200 transition-colors"
                        >
                            Open Flower Monitor →
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="cosmic-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Database className="w-5 h-5 text-nebula-400" />
                        <h3 className="text-xl font-bold text-white">Quick Links</h3>
                    </div>
                    <div className="space-y-3">
                        <a
                            href="http://localhost:8000/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">API Documentation</span>
                                <span className="text-cosmic-400">→</span>
                            </div>
                        </a>
                        <a
                            href="http://localhost:5050"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">pgAdmin</span>
                                <span className="text-nebula-400">→</span>
                            </div>
                        </a>
                        <a
                            href="http://localhost:8000/api/v1/health"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Health Check</span>
                                <span className="text-green-400">→</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
