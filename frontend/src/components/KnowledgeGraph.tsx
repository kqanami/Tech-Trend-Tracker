
import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useQuery } from '@tanstack/react-query';
import { Share2, Maximize2, Loader, Zap, MousePointer2, Layers, Filter, Compass } from 'lucide-react';
import ArticleJarvisHUD from './ArticleJarvisHUD';

// Define types for graph data
interface Node {
    id: string;
    val: number;
    group: string;
    category?: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
}

interface Link {
    source: string | Node;
    target: string | Node;
    value: number;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
    total_nodes: number;
    total_links: number;
}

// Cosmic color palette for different categories
const CATEGORY_COLORS: Record<string, string> = {
    'AI/ML': '#a855f7', // purple
    'Web Development': '#06b6d4', // cyan
    'DevOps': '#10b981', // emerald
    'Security': '#ef4444', // red
    'Blockchain': '#f59e0b', // amber
    'Data Science': '#3b82f6', // blue
    'Mobile': '#ec4899', // pink
    'General': '#94a3b8', // slate
};

const getCategoryColor = (category?: string) => {
    if (!category) return CATEGORY_COLORS['General'];
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
        if (category.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return CATEGORY_COLORS['General'];
};

const KnowledgeGraph: React.FC = () => {
    const fgRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [hoverNode, setHoverNode] = useState<Node | null>(null);
    const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
    const [highlightLinks, setHighlightLinks] = useState(new Set<any>());
    const [simulationRunning, setSimulationRunning] = useState(true);

    // JARVIS HUD State
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [clickPos, setClickPos] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Fetch graph data
    const { data: graphData, isLoading } = useQuery<GraphData>({
        queryKey: ['knowledge-graph'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8000/api/v1/graph/data?limit=250');
            return res.json();
        },
        refetchOnWindowFocus: false,
    });

    // Process high-res neighbors for highlighting
    const neighbors = useMemo(() => {
        if (!graphData) return new Map<string, Set<string>>();
        const map = new Map<string, Set<string>>();
        graphData.links.forEach(link => {
            const s = typeof link.source === 'string' ? link.source : (link.source as any).id;
            const t = typeof link.target === 'string' ? link.target : (link.target as any).id;

            if (!map.has(s)) map.set(s, new Set());
            if (!map.has(t)) map.set(t, new Set());
            map.get(s)!.add(t);
            map.get(t)!.add(s);
        });
        return map;
    }, [graphData]);

    const handleNodeHover = (node: any) => {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        setHoverNode(node || null);

        if (node) {
            const nodeNeighbors = neighbors.get(node.id) || new Set();
            setHighlightNodes(new Set([node.id, ...Array.from(nodeNeighbors)]));

            graphData?.links.forEach(link => {
                const s = typeof link.source === 'string' ? link.source : (link.source as any).id;
                const t = typeof link.target === 'string' ? link.target : (link.target as any).id;
                if (s === node.id || t === node.id) {
                    setHighlightLinks(prev => new Set([...Array.from(prev), link]));
                }
            });
        }
    };

    // Handle resize
    useEffect(() => {
        const updateDimensions = () => {
            if (isFullscreen) {
                setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
                return;
            }

            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) observer.observe(containerRef.current);
        window.addEventListener('resize', updateDimensions);
        updateDimensions();

        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateDimensions);
            document.body.style.overflow = 'auto';
        };
    }, [isFullscreen]);

    // Configuration of forces when data loads
    useEffect(() => {
        if (graphData && fgRef.current) {
            // Apply custom forces
            fgRef.current.d3Force('charge').strength(-200);
            fgRef.current.d3Force('link').distance((link: any) => 60 + (1 / (link.value || 1)) * 120);

            // Force centering
            fgRef.current.d3Force('center', null); // Remove default center if any

            setTimeout(() => {
                fgRef.current.zoomToFit(1000, 150);
            }, 500);
        }
    }, [graphData]);

    if (isLoading) {
        return (
            <div className="h-[700px] flex items-center justify-center bg-space-950/40 rounded-2xl border border-white/10 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader className="w-12 h-12 text-cosmic-400 animate-spin" />
                        <div className="absolute inset-0 blur-2xl bg-cosmic-500/40 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <span className="text-cosmic-100 text-lg font-bold block tracking-tight uppercase">Initializing Galaxy</span>
                        <span className="text-gray-500 text-[10px] font-mono tracking-[0.3em] mt-2 block opacity-70">COMPUTING NEURAL FORCE VECTORS</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return (
            <div className="h-[700px] flex items-center justify-center bg-space-950/40 rounded-2xl border border-white/10 backdrop-blur-xl text-center">
                <div className="max-w-md p-10 bg-white/5 rounded-[40px] border border-white/10 shadow-2xl space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                        <Share2 className="w-10 h-10 text-gray-700" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white">The Void is Empty</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">No technology connections detected in the current timeline. Process articles from the analyzer to populate the Tech Galaxy.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[500] w-screen h-screen' : 'h-[850px]'}`}>
            <div className={`w-full h-full bg-[#030712] transition-all duration-500 overflow-hidden group border border-white/10 shadow-3xl relative ${isFullscreen ? 'rounded-0' : 'rounded-[3rem] ring-1 ring-white/5'}`}>
                {/* --- TOP HEADER NAVIGATION --- */}
                <div className="absolute top-0 left-0 w-full p-8 z-30 flex justify-between items-start pointer-events-none">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl">
                                <Zap className="w-6 h-6 text-cosmic-400 fill-cosmic-400/20" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Neural Galaxy</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Deep Insight Engine v2.0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pointer-events-auto">
                        {/* Stats Pill */}
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-3xl flex items-center gap-6 shadow-2xl transition-all hover:bg-white/10">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nodes</span>
                                <span className="text-lg font-black text-cosmic-300 leading-none">{graphData.total_nodes}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Paths</span>
                                <span className="text-lg font-black text-nebula-300 leading-none">{graphData.total_links}</span>
                            </div>
                        </div>

                        {/* Controls Panel */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className={`w-12 h-12 border rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 z-50 ${isFullscreen
                                    ? 'bg-cosmic-500/20 border-cosmic-500/30 text-cosmic-400'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                                    }`}
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                <Maximize2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fgRef.current?.zoomToFit(800, 100)}
                                className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all text-white/70 hover:text-white hover:scale-105 active:scale-95 shadow-xl"
                                title="Refocus View"
                            >
                                <Compass className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setSimulationRunning(!simulationRunning)}
                                className={`w-12 h-12 border rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${simulationRunning
                                    ? 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                                    : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                    }`}
                                title={simulationRunning ? "Freeze Simulation" : "Resume Simulation"}
                            >
                                <Layers className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- INTERACTIVE TOOLTIP --- */}
                {hoverNode && (
                    <div className="absolute top-28 left-8 z-40 p-6 bg-slate-950/80 border border-white/10 rounded-3xl backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-left-4 duration-300 border-l-4"
                        style={{ borderLeftColor: getCategoryColor(hoverNode.category) }}>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full shadow-lg animate-pulse"
                                    style={{ backgroundColor: getCategoryColor(hoverNode.category), boxShadow: `0 0 15px ${getCategoryColor(hoverNode.category)}` }} />
                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{hoverNode.id}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Articles</p>
                                    <p className="text-xl font-bold text-white">{hoverNode.val}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Network</p>
                                    <p className="text-xl font-bold text-white">{neighbors.get(hoverNode.id)?.size || 0}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3 h-3 text-gray-500" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Category:
                                        <span className="ml-1.5 text-white">{hoverNode.category || 'General'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LEGEND --- */}
                <div className="absolute bottom-8 right-8 z-30 pointer-events-none space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <div className="p-5 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl space-y-3 shadow-2xl">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Neural Segments</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                                <div key={cat} className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tight whitespace-nowrap">{cat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- HINT BAR --- */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6 bg-white/5 px-8 py-3 rounded-full border border-white/5 backdrop-blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 shadow-2xl">
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <MousePointer2 className="w-3 h-3 text-cosmic-400" /> Pan & Drag
                    </div>
                    <div className="w-px h-3 bg-white/10" />
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <Maximize2 className="w-3 h-3 text-nebula-400" /> Scroll to Scale
                    </div>
                </div>

                {/* --- GRAPH CANVAS --- */}
                <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
                    {/* Visual Atmosphere */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_#0a0f1e_0%,_#030712_100%)]" />
                        <div className="absolute top-0 left-0 w-full h-full opacity-30 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                    </div>

                    <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        nodeRelSize={1}

                        // Force Control
                        cooldownTime={simulationRunning ? 15000 : 0}
                        warmupTicks={100}

                        // Links
                        linkWidth={link => {
                            const isHighlighted = highlightLinks.has(link);
                            return isHighlighted ? 4 : Math.sqrt((link as any).value || 1) * 1.5;
                        }}
                        linkColor={link => {
                            const isHighlighted = highlightLinks.has(link);
                            if (isHighlighted) return `rgba(168, 85, 247, 0.8)`;
                            return 'rgba(255, 255, 255, 0.05)';
                        }}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 3 : 0}
                        linkDirectionalParticleSpeed={0.004}
                        linkCurvature={0.15}

                        backgroundColor="rgba(0,0,0,0)"
                        onNodeHover={handleNodeHover}

                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const isHighlighted = highlightNodes.has(node.id);

                            const val = node.val || 5;
                            const baseRadius = Math.sqrt(val) * 2.5;
                            const radius = baseRadius * (isHighlighted ? 1.2 : 1);

                            // Coord safety
                            if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

                            const alpha = hoverNode ? (isHighlighted ? 1 : 0.1) : 1;
                            const color = getCategoryColor(node.category);

                            // --- Pulsing Aura for high-value nodes ---
                            if (val > 10 || isHighlighted) {
                                const time = Date.now() / 1000;
                                const pulse = (Math.sin(time * 3) + 1) / 2;
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, radius * (1.2 + pulse * 0.4), 0, 2 * Math.PI, false);
                                ctx.fillStyle = `${color}${Math.floor(alpha * 20).toString(16).padStart(2, '0')}`;
                                ctx.fill();
                            }

                            // --- Main Node Body ---
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

                            // Inner Glow
                            if (isHighlighted) {
                                ctx.shadowColor = color;
                                ctx.shadowBlur = radius * 3;
                            }

                            // Gradient fill
                            try {
                                const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
                                grad.addColorStop(0, color);
                                grad.addColorStop(0.7, color + 'cc');
                                grad.addColorStop(1, 'rgba(0,0,0,0.4)');
                                ctx.fillStyle = grad;
                                ctx.fill();
                            } catch (e) {
                                ctx.fillStyle = color;
                                ctx.fill();
                            }

                            ctx.shadowBlur = 0;

                            // --- Labels ---
                            const showLabel = globalScale > 0.8 || isHighlighted;
                            if (showLabel) {
                                const label = node.id;
                                const fontSize = (isHighlighted ? 14 : 10) / globalScale;
                                ctx.font = `bold ${fontSize}px "Outfit", "Inter", sans-serif`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';

                                const textWidth = ctx.measureText(label).width;
                                const padding = 4 / globalScale;

                                // Glass label background
                                ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
                                ctx.beginPath();
                                ctx.roundRect(node.x - textWidth / 2 - padding, node.y + radius + 10 - fontSize / 2 - padding, textWidth + padding * 2, fontSize + padding * 2, 4 / globalScale);
                                ctx.fill();

                                // Text
                                ctx.fillStyle = isHighlighted ? '#ffffff' : `rgba(255, 255, 255, ${alpha * 0.7})`;
                                ctx.fillText(label, node.x, node.y + radius + 10);
                            }
                        }}
                        onNodeClick={(node: any, event: any) => {
                            if (fgRef.current) {
                                fgRef.current.centerAt(node.x, node.y, 800);
                                fgRef.current.zoom(3, 1000);
                            }

                            // Set JARVIS HUD state
                            setClickPos({ x: event.clientX, y: event.clientY });
                            setSelectedNodeId(node.id);
                        }}
                    />
                </div>
            </div>

            {/* JARVIS Overlay - MOVED OUTSIDE CLIPPED CONTAINER */}
            <ArticleJarvisHUD
                nodeId={selectedNodeId}
                onClose={() => setSelectedNodeId(null)}
                position={clickPos}
            />
        </div>
    );
};

export default KnowledgeGraph;
