
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Globe, Zap, Search, Activity, ShieldCheck, ExternalLink, Clock, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Article {
    id: number;
    title: string;
    summary: string;
    url: string;
    source: string;
    published_at: string;
    category: string;
    technical_analysis: string;
    sentiment_score: number;
}

interface ArticleJarvisHUDProps {
    nodeId: string | null;
    onClose: () => void;
    position: { x: number; y: number };
}

const SentimentBar: React.FC<{ score: number }> = ({ score }) => {
    const pct = Math.round(((score + 1) / 2) * 100);
    const color = pct >= 65 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    const label = pct >= 65 ? 'Positive' : pct >= 40 ? 'Neutral' : 'Negative';
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center group/sent">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] group-hover/sent:text-white/50 transition-colors font-outfit">Sentiment Analysis</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/5" style={{ color }}>{label}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                <motion.div
                    className="h-full rounded-full relative z-10"
                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}44` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Gloss effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 z-20 pointer-events-none" />
            </div>
        </div>
    );
};

const ArticleJarvisHUD: React.FC<ArticleJarvisHUDProps> = ({ nodeId, onClose, position }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: articles, isLoading } = useQuery<Article[]>({
        queryKey: ['articles', nodeId],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8000/api/v1/articles?tag=${nodeId}&page_size=6`);
            const data = await res.json();
            return data.items || [];
        },
        enabled: !!nodeId,
    });

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.97 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, staggerChildren: 0.08 } },
        exit: { opacity: 0, scale: 0.97, transition: { duration: 0.25 } }
    };

    const itemVariants = {
        hidden: { y: 16, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 22, stiffness: 120 } }
    };

    return (
        <AnimatePresence>
            {nodeId && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
                        onClick={onClose}
                    />

                    {/* Subtle radial pulse from click origin */}
                    <motion.div
                        className="absolute w-2 h-2 rounded-full bg-indigo-400/60"
                        style={{
                            left: position.x,
                            top: position.y,
                            translateX: '-50%',
                            translateY: '-50%',
                        }}
                        animate={{ scale: 400, opacity: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Main Panel */}
                    <div className="relative w-full max-w-6xl h-[90vh] flex flex-col bg-[#050914] border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden pointer-events-auto font-inter">

                        {/* --- HUD DECORATIONS --- */}
                        <div className="absolute inset-0 pointer-events-none opacity-10">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.1),_transparent_70%)]" />
                            {/* Static grid instead of complex shadows */}
                            <div className="absolute inset-0 border border-white/5 bg-[size:50px_50px] bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
                        </div>

                        {/* Top gradient accent */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent z-50" />

                        {/* ── HEADER ── */}
                        <div className="flex justify-between items-start px-10 pt-10 pb-8 border-b border-white/5 shrink-0 relative bg-gradient-to-b from-blue-950/20 to-transparent">
                            <div className="flex items-center gap-6">
                                {/* Icon badge with pulse */}
                                <div className="relative">
                                    <div className="w-14 h-14 bg-blue-500/10 border border-blue-400/20 rounded-2xl flex items-center justify-center shadow-2xl relative z-10">
                                        <Cpu className="w-7 h-7 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                    </div>
                                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse -z-0" />
                                </div>

                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/70 font-outfit">AI Orbital Intelligence</span>
                                        <div className="h-px w-8 bg-blue-400/20" />
                                    </div>
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mt-1 font-outfit italic">
                                        {nodeId}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-400/40 uppercase tracking-widest">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                                            Active Link
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                                            <Globe className="w-3 h-3" />
                                            JARVIS MATRIX v4.0
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-mono">
                                            {currentTime.toLocaleTimeString([], { hour12: false })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-11 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* ── BODY ── */}
                        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0 min-h-0">

                            {/* Left Sidebar */}
                            <motion.div
                                className="col-span-3 border-r border-white/5 p-8 flex flex-col gap-8 overflow-y-auto bg-black/20"
                                variants={itemVariants}
                            >
                                {/* Scanner visual */}
                                <div className="aspect-square relative flex items-center justify-center bg-blue-500/[0.03] border border-blue-500/10 rounded-[2rem] overflow-hidden group/scanner">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1),_transparent_70%)]" />

                                    {/* Rotating Rings */}
                                    <div className="relative w-32 h-32">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 border-[3px] border-dashed border-blue-500/20 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-4 border-2 border-dashed border-blue-400/10 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ scale: [0.95, 1.05, 0.95] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 flex items-center justify-center"
                                        >
                                            <Zap className="w-12 h-12 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]" />
                                        </motion.div>
                                    </div>

                                    {/* Scan line effect */}
                                    <motion.div
                                        animate={{ top: ['-10%', '110%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                        className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent z-10"
                                    />

                                    {/* Corner accents */}
                                    <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-blue-400/30" />
                                    <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-blue-400/30" />
                                    <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-blue-400/30" />
                                    <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-blue-400/30" />
                                </div>

                                {/* HUD Indicators */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-outfit">Target Status</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Signal', value: '98.4%', icon: Activity, color: '#60a5fa' },
                                            { label: 'Articles', value: articles?.length ?? '—', icon: Search, color: '#818cf8' },
                                            { label: 'Status', value: 'Stable', icon: ShieldCheck, color: '#34d399' },
                                            { label: 'Sync', value: 'Realtime', icon: Clock, color: '#f59e0b' },
                                        ].map((stat, i) => (
                                            <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all group/stat">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <stat.icon className="w-3 h-3 opacity-40 group-hover/stat:opacity-100 transition-opacity" style={{ color: stat.color }} />
                                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{stat.label}</span>
                                                </div>
                                                <p className="text-base font-black text-white leading-none font-outfit">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Matrix Log */}
                                <div className="flex-1 p-5 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden group/log">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20" />
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-outfit mb-4">Neural Process Log</p>
                                    <div className="space-y-2 font-mono text-[9px]">
                                        {[
                                            `[INIT] NODE_ID::${nodeId}`,
                                            `[SCAN] FREQ_SYNC::984.2Hz`,
                                            `[DATA] PARSING_FRAGMENTS...`,
                                            `[AI] GENERATING_INSIGHTS`,
                                            `[HUD] RENDER_STREAM_READY`
                                        ].map((line, i) => (
                                            <motion.p
                                                key={i}
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="text-blue-400/60 flex items-center gap-2"
                                            >
                                                <span className="text-blue-500/30">»</span> {line}
                                            </motion.p>
                                        ))}
                                    </div>
                                    <div className="absolute bottom-4 right-4 animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right: Article Feed */}
                            <motion.div
                                className="col-span-9 flex flex-col min-h-0"
                                variants={containerVariants}
                            >
                                {/* Feed header */}
                                <div className="px-8 py-5 border-b border-white/5 shrink-0 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Intelligence Fragments</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                        {articles?.length ?? 0} results for "{nodeId}"
                                    </span>
                                </div>

                                {/* Scrollable article list */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {isLoading ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="h-28 bg-white/[0.03] border border-white/5 rounded-2xl animate-pulse" />
                                        ))
                                    ) : articles?.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-600">
                                            <Search className="w-12 h-12 opacity-30" />
                                            <p className="text-sm font-bold uppercase tracking-widest opacity-50">No fragments found</p>
                                        </div>
                                    ) : (
                                        articles?.map((article) => (
                                            <motion.div
                                                key={article.id}
                                                variants={itemVariants}
                                                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-200 space-y-3"
                                            >
                                                {/* Category badge */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {article.category && (
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                                                    {article.category}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 text-[9px] font-bold text-gray-600 uppercase tracking-wider">
                                                                <Tag className="w-2.5 h-2.5" />
                                                                {article.source}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-[9px] text-gray-600">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {new Date(article.published_at).toLocaleDateString()}
                                                            </span>
                                                        </div>

                                                        <a
                                                            href={article.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-white font-bold text-base leading-snug hover:text-indigo-300 transition-colors block"
                                                        >
                                                            {article.title}
                                                        </a>
                                                    </div>

                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </div>

                                                {article.summary && (
                                                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{article.summary}</p>
                                                )}

                                                {/* Sentiment */}
                                                {typeof article.sentiment_score === 'number' && (
                                                    <SentimentBar score={article.sentiment_score} />
                                                )}

                                                {/* Bottom separator line */}
                                                <div className="absolute bottom-0 left-5 right-5 h-px bg-white/5 group-hover:bg-white/10 transition-colors" />
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArticleJarvisHUD;
