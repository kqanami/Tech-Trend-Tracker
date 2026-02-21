import { useEffect, useState } from 'react'
import { Zap, TrendingUp, TrendingDown, Minus, Radio, Flame, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface AnalysisData {
    verdict: string
    key_signals: string[]
    impact_level: 'High' | 'Medium' | 'Low'
    hype_or_signal: 'Signal' | 'Hype' | 'Mixed'
    technical_depth: number
}

interface ArticleAnalysisProps {
    technicalAnalysis: string | null
    sentimentScore?: number
    compact?: boolean // compact=true for card view, false for detail page
}

function parseAnalysis(raw: string | null): AnalysisData | null {
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw)
        if (parsed.verdict && parsed.impact_level) return parsed as AnalysisData
        return null
    } catch {
        return null
    }
}

// --- Typewriter effect hook ---
function useTypewriter(text: string, speed = 18, enabled = true) {
    const [displayed, setDisplayed] = useState('')
    useEffect(() => {
        if (!enabled) { setDisplayed(text); return }
        setDisplayed('')
        let i = 0
        const interval = setInterval(() => {
            setDisplayed(text.slice(0, i + 1))
            i++
            if (i >= text.length) clearInterval(interval)
        }, speed)
        return () => clearInterval(interval)
    }, [text, speed, enabled])
    return displayed
}

// --- Impact badge ---
const IMPACT_CONFIG = {
    High: { color: 'text-red-300 bg-red-500/15 border-red-500/30', icon: Flame, label: 'High Impact' },
    Medium: { color: 'text-amber-300 bg-amber-500/15 border-amber-500/30', icon: TrendingUp, label: 'Mid Impact' },
    Low: { color: 'text-blue-300 bg-blue-500/15 border-blue-500/30', icon: Minus, label: 'Low Impact' },
}

const HYPE_CONFIG = {
    Signal: { color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30', icon: Radio, label: '📡 Signal' },
    Hype: { color: 'text-purple-300 bg-purple-500/15 border-purple-500/30', icon: AlertTriangle, label: '🔮 Hype' },
    Mixed: { color: 'text-sky-300 bg-sky-500/15 border-sky-500/30', icon: Zap, label: '⚡ Mixed' },
}

export default function ArticleAnalysis({ technicalAnalysis, sentimentScore, compact = true }: ArticleAnalysisProps) {
    const [expanded, setExpanded] = useState(!compact)
    const [signalsVisible, setSignalsVisible] = useState(false)

    const data = parseAnalysis(technicalAnalysis)

    // Animate signals after mount
    useEffect(() => {
        if (!compact || expanded) {
            const t = setTimeout(() => setSignalsVisible(true), 300)
            return () => clearTimeout(t)
        }
    }, [compact, expanded])

    const verdict = useTypewriter(data?.verdict ?? '', 14, !compact || expanded)

    // --- Fallback for legacy plain-text analysis ---
    if (!data) {
        if (!technicalAnalysis) return null
        return (
            <div className="p-3 bg-cosmic-500/5 rounded-xl border border-cosmic-500/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-1.5 h-1.5 bg-cosmic-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-cosmic-300 uppercase tracking-widest">AI Verdict</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{technicalAnalysis}</p>
            </div>
        )
    }

    const impactCfg = IMPACT_CONFIG[data.impact_level] ?? IMPACT_CONFIG.Medium
    const hypeCfg = HYPE_CONFIG[data.hype_or_signal] ?? HYPE_CONFIG.Mixed
    const ImpactIcon = impactCfg.icon

    // Sentiment color
    const sentimentColor = (sentimentScore ?? 0) > 0.1
        ? 'bg-emerald-500'
        : (sentimentScore ?? 0) < -0.1
            ? 'bg-red-500'
            : 'bg-gray-400'

    return (
        <div className="relative rounded-xl overflow-hidden">
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cosmic-500/30 via-nebula-500/20 to-transparent p-px">
                <div className="absolute inset-0 rounded-xl bg-space-950/90" />
            </div>

            <div className="relative p-3">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cosmic-400 animate-pulse" />
                        <span className="text-[10px] font-black text-cosmic-300 uppercase tracking-widest">AI Analysis</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Impact badge */}
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${impactCfg.color}`}>
                            <ImpactIcon className="w-2.5 h-2.5" />
                            {impactCfg.label}
                        </span>
                        {/* Hype-or-Signal badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${hypeCfg.color}`}>
                            {hypeCfg.label}
                        </span>
                        {compact && (
                            <button
                                onClick={() => { setExpanded(v => !v); setSignalsVisible(true) }}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Compact header preview — shows when collapsed */}
                {compact && !expanded && (
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic cursor-pointer"
                        onClick={() => { setExpanded(true); setSignalsVisible(true) }}>
                        {data.verdict}
                    </p>
                )}

                {/* Full content — shows when expanded or not compact */}
                {(!compact || expanded) && (
                    <div className="space-y-2.5 mt-1">
                        {/* Verdict typewriter */}
                        <p className="text-[12px] text-gray-200 leading-relaxed font-medium min-h-[2.5rem]">
                            {verdict}
                            <span className="animate-pulse">▌</span>
                        </p>

                        {/* Key Signals */}
                        {data.key_signals?.length > 0 && (
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Key Signals</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {data.key_signals.map((signal, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-300 font-medium transition-all duration-500"
                                            style={{
                                                opacity: signalsVisible ? 1 : 0,
                                                transform: signalsVisible ? 'translateY(0)' : 'translateY(4px)',
                                                transitionDelay: `${i * 120}ms`,
                                            }}
                                        >
                                            {signal}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Technical Depth meter */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                                <span className="text-gray-500">Technical Depth</span>
                                <span className={
                                    data.technical_depth >= 7 ? 'text-emerald-400' :
                                        data.technical_depth >= 4 ? 'text-amber-400' : 'text-gray-400'
                                }>
                                    {data.technical_depth}/10
                                </span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${data.technical_depth >= 7
                                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                            : data.technical_depth >= 4
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                                : 'bg-gray-600'
                                        }`}
                                    style={{ width: `${(data.technical_depth / 10) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Sentiment bar (if provided) */}
                        {sentimentScore !== undefined && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-500">Sentiment</span>
                                    <span className={(sentimentScore > 0.1 ? 'text-emerald-400' : sentimentScore < -0.1 ? 'text-red-400' : 'text-gray-400')}>
                                        {sentimentScore > 0.1 ? 'Positive' : sentimentScore < -0.1 ? 'Negative' : 'Neutral'}
                                    </span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
                                    {/* Center divider */}
                                    <div className="absolute left-1/2 top-0 w-px h-full bg-white/20 z-10" />
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${sentimentColor}`}
                                        style={{
                                            width: `${Math.abs(sentimentScore) * 50}%`,
                                            marginLeft: sentimentScore > 0 ? '50%' : `${50 - Math.abs(sentimentScore) * 50}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
