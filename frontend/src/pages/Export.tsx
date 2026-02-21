import { useState } from 'react'
import { exportAPI } from '../api/client'
import { Download, FileText, Database, TrendingUp, Github, Calendar } from 'lucide-react'
import { useToast } from '../components/Toast'

export default function Export() {
    const { showToast } = useToast()
    const [exporting, setExporting] = useState<string | null>(null)

    const handleExport = async (type: string, params?: any) => {
        setExporting(type)
        try {
            let response
            let filename = ''

            switch (type) {
                case 'articles-csv':
                    response = await exportAPI.exportArticlesCSV(params)
                    filename = `articles_${new Date().toISOString().split('T')[0]}.csv`
                    break
                case 'articles-json':
                    response = await exportAPI.exportArticlesJSON(params)
                    filename = `articles_${new Date().toISOString().split('T')[0]}.json`
                    break
                case 'trends-csv':
                    response = await exportAPI.exportTrendsCSV(params)
                    filename = `trends_${new Date().toISOString().split('T')[0]}.csv`
                    break
                case 'repos-csv':
                    response = await exportAPI.exportReposCSV(params)
                    filename = `repos_${new Date().toISOString().split('T')[0]}.csv`
                    break
                case 'stats':
                    response = await exportAPI.exportStatsSummary(params?.days)
                    filename = `stats_${new Date().toISOString().split('T')[0]}.json`
                    break
                default:
                    return
            }

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            showToast(`Exported ${type} successfully!`, 'success')
        } catch (error) {
            showToast(`Failed to export ${type}`, 'error')
        } finally {
            setExporting(null)
        }
    }

    const exportOptions = [
        {
            id: 'articles-csv',
            title: 'Export Articles (CSV)',
            description: 'Export articles data in CSV format',
            icon: FileText,
            color: 'cosmic',
        },
        {
            id: 'articles-json',
            title: 'Export Articles (JSON)',
            description: 'Export articles data in JSON format',
            icon: FileText,
            color: 'cosmic',
        },
        {
            id: 'trends-csv',
            title: 'Export Trends (CSV)',
            description: 'Export trends data in CSV format',
            icon: TrendingUp,
            color: 'purple',
        },
        {
            id: 'repos-csv',
            title: 'Export Repositories (CSV)',
            description: 'Export repositories data in CSV format',
            icon: Github,
            color: 'blue',
        },
        {
            id: 'stats',
            title: 'Export Statistics Summary',
            description: 'Export summary statistics in JSON format',
            icon: Database,
            color: 'green',
        },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <Download className="w-12 h-12 text-green-500" />
                    Data Export
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto">
                    Export your data in various formats for analysis, reporting, or backup.
                </p>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exportOptions.map((option) => {
                    const Icon = option.icon
                    const isExporting = exporting === option.id

                    return (
                        <div
                            key={option.id}
                            className="cosmic-card group cursor-pointer hover:scale-[1.02] transition-transform"
                            onClick={() => !isExporting && handleExport(option.id)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-${option.color}-500/10 text-${option.color}-400 ring-1 ring-${option.color}-500/20`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                {isExporting && (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                {option.title}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">{option.description}</p>
                            <div className="flex items-center text-xs text-purple-400 font-bold group-hover:text-purple-300 transition-colors">
                                <Download className="w-3 h-3 mr-1" />
                                {isExporting ? 'Exporting...' : 'Click to Export'}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Export with Filters */}
            <div className="cosmic-card">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Calendar className="w-5 h-5 mr-3 text-purple-400" />
                    Export with Filters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                        <input
                            type="date"
                            id="start-date"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">End Date</label>
                        <input
                            type="date"
                            id="end-date"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            onClick={() => {
                                const startDate = (document.getElementById('start-date') as HTMLInputElement)?.value
                                const endDate = (document.getElementById('end-date') as HTMLInputElement)?.value
                                handleExport('articles-csv', { start_date: startDate, end_date: endDate })
                            }}
                            className="w-full px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-xl text-purple-300 font-bold hover:bg-purple-500/30 transition-colors"
                        >
                            Export Articles with Date Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

