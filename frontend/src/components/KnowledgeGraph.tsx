
import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useQuery } from '@tanstack/react-query';
import { Share2, Maximize2, Loader, Zap, Info, MousePointer2 } from 'lucide-react';

// Define types for graph data
interface Node {
    id: string;
    val: number;
    group: string;
    category?: string;
    x?: number;
    y?: number;
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

const KnowledgeGraph: React.FC = () => {
    const fgRef = useRef<any>();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [hoverNode, setHoverNode] = useState<Node | null>(null);
    const [highlightNodes, setHighlightNodes] = useState(new Set());
    const [highlightLinks, setHighlightLinks] = useState(new Set());

    // Fetch graph data
    const { data: graphData, isLoading } = useQuery<GraphData>({
        queryKey: ['knowledge-graph'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8000/api/v1/graph/data?limit=200');
            return res.json();
        },
        refetchOnWindowFocus: false,
    });

    // Process high-res neighbors for highlighting
    const neighbors = useMemo(() => {
        if (!graphData) return new Map();
        const map = new Map();
        graphData.links.forEach(link => {
            const s = typeof link.source === 'string' ? link.source : (link.source as any).id;
            const t = typeof link.target === 'string' ? link.target : (link.target as any).id;

            if (!map.has(s)) map.set(s, new Set());
            if (!map.has(t)) map.set(t, new Set());
            map.get(s).add(t);
            map.get(t).add(s);
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
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) observer.observe(containerRef.current);
        updateDimensions();

        return () => observer.disconnect();
    }, []);

    // Zoom to fit when data loads
    useEffect(() => {
        if (graphData && fgRef.current) {
            setTimeout(() => {
                fgRef.current.zoomToFit(600, 80);
            }, 800);
        }
    }, [graphData]);

    if (isLoading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-space-950/40 rounded-2xl border border-white/10 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader className="w-12 h-12 text-cosmic-400 animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-cosmic-500/30 animate-pulse" />
                    </div>
                    <div className="text-center">
                        <span className="text-cosmic-100 text-lg font-bold block">Mapping Galaxy</span>
                        <span className="text-gray-500 text-xs font-mono tracking-widest mt-1">CALCULATING NODE VECTORS</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-space-950/40 rounded-2xl border border-white/10 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-4 text-center p-8 bg-white/5 rounded-3xl border border-white/10 max-w-sm">
                    <Share2 className="w-16 h-16 text-gray-700 opacity-50" />
                    <div>
                        <p className="text-white text-lg font-bold">Dark Matter Detected</p>
                        <p className="text-gray-400 text-sm mt-2 leading-relaxed"> No technology nodes identified yet. Process some articles to generate the knowledge graph.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[700px] cosmic-card p-0 overflow-hidden group border border-white/10 shadow-2xl">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-8 z-20 flex justify-between items-start pointer-events-none">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cosmic-500/20 rounded-lg border border-cosmic-500/30">
                            <Zap className="w-5 h-5 text-cosmic-300" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight uppercase">Tech Galaxy</h3>
                    </div>
                    <p className="text-gray-400 text-[11px] uppercase tracking-[0.2em] font-bold pl-12 flex items-center gap-2">
                        <div className="w-1 h-1 bg-cosmic-400 rounded-full animate-pulse" />
                        Neural Co-occurrence Analysis
                    </p>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Nodes</span>
                            <span className="text-sm font-black text-cosmic-300">{graphData.total_nodes}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Links</span>
                            <span className="text-sm font-black text-nebula-300">{graphData.total_links}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => fgRef.current?.zoomToFit(600, 100)}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl backdrop-blur-xl transition-all text-white/70 hover:text-white"
                        title="Reset View"
                    >
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Interaction Tooltip */}
            {hoverNode && (
                <div className="absolute top-24 left-8 z-30 p-4 bg-space-950/80 border border-cosmic-500/30 rounded-2xl backdrop-blur-2xl shadow-2xl pointer-events-none animate-in fade-in slide-in-from-left-4 duration-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-cosmic-400 shadow-[0_0_10px_#a855f7]" />
                        <span className="text-lg font-black text-white uppercase tracking-tight">{hoverNode.id}</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between gap-12">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Mentions</span>
                            <span className="text-[11px] font-bold text-cosmic-300">{hoverNode.val} Articles</span>
                        </div>
                        <div className="flex justify-between gap-12">
                            <span className="text-[10px] uppercase font-bold text-gray-500">Connections</span>
                            <span className="text-[11px] font-bold text-nebula-300">{neighbors.get(hoverNode.id)?.size || 0} Technologies</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                            <div className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                                Category: {hoverNode.category || 'General'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Info */}
            <div className="absolute bottom-8 left-8 z-20 flex items-center gap-4 bg-black/40 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <MousePointer2 className="w-3 h-3" /> Drag to explore
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Maximize2 className="w-3 h-3" /> Scroll to zoom
                </div>
            </div>

            {/* Graph Container */}
            <div ref={containerRef} className="w-full h-full bg-[#030712] relative">
                {/* Canvas glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3b82f644_0%,_transparent_70%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,_#a855f722_0%,_transparent_50%)]" />
                </div>

                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeRelSize={4}
                    linkWidth={link => highlightLinks.has(link) ? 3 : (link as any).value * 0.5}
                    linkColor={link => highlightLinks.has(link) ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 4 : 0}
                    linkDirectionalParticleSpeed={0.005}
                    backgroundColor="rgba(0,0,0,0)"
                    onNodeHover={handleNodeHover}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const isHighlighted = highlightNodes.has(node.id);
                        const isMain = hoverNode?.id === node.id;

                        const val = node.val || 5;
                        const radius = Math.sqrt(val) * (dimensions.width < 1000 ? 1.5 : 2);

                        // Dim others when highlighting
                        const alpha = hoverNode ? (isHighlighted ? 1 : 0.15) : 1;

                        // Node Circle with Glow
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);

                        if (isHighlighted) {
                            ctx.shadowColor = "#a855f7";
                            ctx.shadowBlur = radius * 2;
                        }

                        // Gradient fill
                        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
                        gradient.addColorStop(0, `rgba(168, 85, 247, ${alpha})`);
                        gradient.addColorStop(1, `rgba(79, 70, 229, ${alpha})`);

                        ctx.fillStyle = gradient;
                        ctx.fill();

                        if (isHighlighted) {
                            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                            ctx.lineWidth = 1 / globalScale;
                            ctx.stroke();
                        }

                        ctx.shadowBlur = 0;

                        // Label
                        const label = node.id;
                        const fontSize = (isHighlighted ? 12 : 10) / globalScale;

                        if (globalScale > 0.5 || isHighlighted) {
                            ctx.font = `${fontSize}px Inter, Sans-Serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';

                            // Background bar for text
                            const textWidth = ctx.measureText(label).width;
                            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
                            ctx.fillRect(node.x - textWidth / 2 - 2, node.y + radius + 4, textWidth + 4, fontSize + 4);

                            ctx.fillStyle = isHighlighted ? `rgba(255, 255, 255, ${alpha})` : `rgba(209, 213, 219, ${alpha * 0.8})`;
                            ctx.fillText(label, node.x, node.y + radius + 10);
                        }
                    }}
                    onNodeClick={node => {
                        if (fgRef.current) {
                            fgRef.current.centerAt(node.x, node.y, 800);
                            fgRef.current.zoom(2.5, 1000);
                        }
                    }}
                />
            </div>

            {/* Corner Info */}
            <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                    <div className="w-2 h-2 rounded-full bg-cosmic-400" />
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Cluster Engine Active</span>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeGraph;
