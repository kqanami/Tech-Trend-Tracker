
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Globe, Zap, Search, Activity, ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ArticleAnalysis from './ArticleAnalysis';

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

const ArticleJarvisHUD: React.FC<ArticleJarvisHUDProps> = ({ nodeId, onClose, position }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch articles for the specific tag
    const { data: articles, isLoading } = useQuery<Article[]>({
        queryKey: ['articles', nodeId],
        queryFn: async () => {
            const res = await fetch(`http://localhost:8000/api/v1/articles?tag=${nodeId}&page_size=5`);
            const data = await res.json();
            return data.items || [];
        },
        enabled: !!nodeId,
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5, staggerChildren: 0.1 }
        },
        exit: { opacity: 0, transition: { duration: 0.3 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0, scale: 0.95 },
        visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 100 } }
    };

    return (
        <AnimatePresence>
            {nodeId && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* Pulsing Backdrop Overlay */}
                    <div className="absolute inset-0 bg-space-950/90 backdrop-blur-xl cursor-default" onClick={onClose} />

                    {/* JARVIS Grid Overlay */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                    {/* HUD Central Scanner Expansion (Dynamic Origin) */}
                    <motion.div
                        className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee]"
                        initial={{
                            scale: 0,
                            x: position.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0),
                            y: position.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)
                        }}
                        animate={{ scale: 1500, opacity: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Main Interface Content */}
                    <div className="relative w-full max-w-6xl h-[85vh] flex flex-col bg-cyan-950/20 border border-cyan-500/30 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl overflow-hidden m-4 pointer-events-auto">

                        {/* Internal Glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

                        {/* Top HUD Header */}
                        <div className="flex justify-between items-start p-8 border-b border-cyan-500/20">
                            <motion.div
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="space-y-1"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                        <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
                                    </div>
                                    <h2 className="text-4xl font-black text-white tracking-widest uppercase italic">
                                        <span className="text-cyan-400">Intelligence</span> Report: {nodeId}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] font-mono text-cyan-500/60 pl-2">
                                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> NEURAL LINK: ACTIVE</span>
                                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> CORE: JARVIS_V2.0</span>
                                    <span className="flex items-center gap-1 uppercase">LOC: {position.x.toFixed(0)}:{position.y.toFixed(0)}</span>
                                </div>
                            </motion.div>

                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
                            >
                                <X className="w-6 h-6" />
                            </motion.button>
                        </div>

                        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-8">

                            {/* Left Side: Detail & Scanning View */}
                            <motion.div
                                className="col-span-4 space-y-6"
                                variants={itemVariants}
                            >
                                <div className="aspect-square relative flex items-center justify-center border border-cyan-500/10 rounded-[2rem] bg-cyan-950/10 backdrop-blur-sm overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />

                                    {/* Holographic Scanner Rings */}
                                    <div className="relative w-48 h-48">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-2 border border-cyan-400/20 rounded-full flex items-center justify-center"
                                        >
                                            <div className="w-full h-[1px] bg-cyan-400/40 animate-pulse" />
                                        </motion.div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Zap className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_10px_#22d3ee]" />
                                        </div>
                                    </div>

                                    {/* HUD Scan Line */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 w-full h-[2px] bg-cyan-400/30 blur-[1px] z-10"
                                    />
                                </div>

                                {/* Dynamic Stats Dashboard */}
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Signal Strength', value: '98.4%', icon: Activity },
                                        { label: 'Data Density', value: articles?.length || 0, icon: Search },
                                        { label: 'Integrity', value: 'Stable', icon: ShieldAlert },
                                        { label: 'Ref', value: nodeId, icon: Zap }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-1">
                                            <div className="flex items-center gap-2">
                                                <stat.icon className="w-3 h-3 text-cyan-500" />
                                                <span className="text-[9px] font-black text-cyan-500/60 uppercase tracking-widest">{stat.label}</span>
                                            </div>
                                            <p className="text-xl font-black text-white">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Right Side: Article Intel Stream */}
                            <motion.div
                                className="col-span-8 flex flex-col h-full space-y-4"
                                variants={containerVariants}
                            >
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                        Intelligence Fragments
                                    </h3>
                                    <span className="text-[10px] font-mono text-cyan-500/50">MATCH_FOUND: {articles?.length || 0} ITEMS</span>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                                    {isLoading ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="h-32 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl animate-pulse" />
                                        ))
                                    ) : articles?.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-cyan-500/30 gap-4 border border-dashed border-cyan-500/10 rounded-[2rem]">
                                            <Search className="w-16 h-16" />
                                            <p className="font-mono text-sm uppercase tracking-widest">No Intelligence Fragments Found</p>
                                        </div>
                                    ) : (
                                        articles?.map((article) => (
                                            <motion.div
                                                key={article.id}
                                                variants={itemVariants}
                                                className="group relative"
                                            >
                                                <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl border border-cyan-500/20 group-hover:bg-cyan-500/10 transition-all pointer-events-none" />
                                                <div className="relative p-6 space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <a
                                                                href={article.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-lg font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer block"
                                                            >
                                                                {article.title}
                                                            </a>
                                                            <div className="flex items-center gap-3 text-[10px] font-mono text-cyan-500/60 uppercase">
                                                                <span>{article.source}</span>
                                                                <span>•</span>
                                                                <span>{new Date(article.published_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                                                        {article.summary}
                                                    </p>
                                                    <div className="pt-2 border-t border-cyan-500/10">
                                                        <ArticleAnalysis
                                                            technicalAnalysis={article.technical_analysis}
                                                            sentimentScore={article.sentiment_score}
                                                            compact={false}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Bottom HUD Footer Status */}
                        <div className="mt-8 flex justify-between items-end border-t border-cyan-500/20 pt-4">
                            <div className="font-mono text-[9px] text-cyan-500/40 uppercase tracking-[0.3em] space-y-1">
                                <p>SYS_PROC_ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                                <p>MEM_BUFFER: STABLE [{Math.floor(Math.random() * 100)}%]</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-2xl font-black text-cyan-400 italic tracking-widest leading-none">
                                    {currentTime.toLocaleTimeString()}
                                </p>
                                <p className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest">
                                    SYSTEM_TIME ● GMT+5
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArticleJarvisHUD;
