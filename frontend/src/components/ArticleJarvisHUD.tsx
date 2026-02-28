
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
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sentiment</span>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
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
                        className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-default"
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
                    <div className="relative w-full max-w-5xl h-[88vh] flex flex-col bg-[#0a0f1c]/95 border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.7)] backdrop-blur-3xl overflow-hidden pointer-events-auto">

                        {/* Top gradient accent */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-950/30 to-transparent pointer-events-none" />

                        {/* ── HEADER ── */}
                        <div className="flex justify-between items-start px-8 pt-8 pb-6 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-4">
                                {/* Icon badge */}
                                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Cpu className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400/70">Intelligence Report</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none mt-0.5">
                                        {nodeId}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Neural Link Active
                                        </span>
                                        <span className="text-gray-700">·</span>
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                            <Globe className="w-2.5 h-2.5" />
                                            JARVIS v2.0
                                        </span>
                                        <span className="text-gray-700">·</span>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                            {currentTime.toLocaleTimeString()}
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
                                className="col-span-3 border-r border-white/5 p-6 flex flex-col gap-5 overflow-y-auto"
                                variants={itemVariants}
                            >
                                {/* Scanner visual */}
                                <div className="aspect-square relative flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 to-transparent" />

                                    {/* Rings */}
                                    <div className="relative w-28 h-28">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-4 border border-purple-500/15 rounded-full"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Zap className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                        </div>
                                    </div>

                                    {/* Scan line */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%'] }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                                        className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent z-10"
                                    />
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Signal', value: '98.4%', icon: Activity },
                                        { label: 'Articles', value: articles?.length ?? '—', icon: Search },
                                        { label: 'Status', value: 'Stable', icon: ShieldCheck },
                                        { label: 'Node', value: nodeId?.slice(0, 6) ?? '—', icon: Zap },
                                    ].map((stat, i) => (
                                        <div key={i} className="p-3 bg-white/[0.03] border border-white/5 rounded-xl space-y-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <stat.icon className="w-3 h-3 text-indigo-400/60" />
                                                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{stat.label}</span>
                                            </div>
                                            <p className="text-sm font-black text-white leading-none">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* System log */}
                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2">System Log</p>
                                    {[
                                        `> NODE_LOCK: ${nodeId}`,
                                        '> FETCH: articles.api',
                                        '> PARSE: OK',
                                        '> RENDER: STREAMING',
                                    ].map((line, i) => (
                                        <p key={i} className="text-[9px] font-mono text-gray-500 leading-relaxed">{line}</p>
                                    ))}
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
