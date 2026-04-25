
import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useQuery } from '@tanstack/react-query';
import { Maximize2, Loader, Zap, Layers, Compass } from 'lucide-react';
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

    // Configuration of forces when data loads - COSMIC EDITION
    useEffect(() => {
        if (graphData && fgRef.current) {
            // Accessible d3 simulation configuration via d3Force
            fgRef.current.d3Force('charge').strength(-300); // Stronger repulsion for spread
            fgRef.current.d3Force('link').distance((link: any) => 50 + (1 / (link.value || 1)) * 100);

            // --- ADD COSMIC GRAVITY (Centering) ---
            // This pulls all nodes back to the center (0,0) to prevent them from flying away
            fgRef.current.d3Force('center', null); // Keep custom center control
            fgRef.current.d3Force('x', (alpha: number) => {
                graphData.nodes.forEach(node => {
                    node.vx = (node.vx || 0) - (node.x || 0) * 0.05 * alpha;
                });
            });
            fgRef.current.d3Force('y', (alpha: number) => {
                graphData.nodes.forEach(node => {
                    node.vy = (node.vy || 0) - (node.y || 0) * 0.05 * alpha;
                });
            });

            // --- ADD COLLISION FORCE (Anti-Overlap) ---
            // This prevents planets (and their labels) from sitting on top of each other
            fgRef.current.d3Force('collide', (alpha: number) => {
                const nodes = graphData.nodes;
                for (let i = 0; i < nodes.length; i++) {
                    const a = nodes[i];
                    for (let j = i + 1; j < nodes.length; j++) {
                        const b = nodes[j];
                        const dx = (b.x || 0) - (a.x || 0);
                        const dy = (b.y || 0) - (a.y || 0);
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                        // Dynamic collision buffer based on node value (label width)
                        const minCenteredDist = (Math.sqrt(a.val || 5) + Math.sqrt(b.val || 5)) * 12;

                        if (dist < minCenteredDist) {
                            const force = (minCenteredDist - dist) / dist * 0.5 * alpha;
                            const fx = dx * force;
                            const fy = dy * force;
                            a.vx = (a.vx || 0) - fx;
                            a.vy = (a.vy || 0) - fy;
                            b.vx = (b.vx || 0) + fx;
                            b.vy = (b.vy || 0) + fy;
                        }
                    }
                }
            });

            // --- Add Orbital "Galaxy Swirl" Force ---
            fgRef.current.d3Force('cosmic', (alpha: number) => {
                graphData.nodes.forEach(node => {
                    const x = node.x || 0;
                    const y = node.y || 0;

                    // Force vector perpendicular to the center
                    const dist = Math.sqrt(x * x + y * y) || 1;
                    const vortexForce = 0.15 * alpha; // subtle vortex

                    // Vortex movement (tangential)
                    node.vx = (node.vx || 0) + (y / dist) * vortexForce;
                    node.vy = (node.vy || 0) - (x / dist) * vortexForce;
                });
            });

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
                </div>
            </div>
        );
    }

    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
        return (
            <div className="h-[700px] flex items-center justify-center bg-space-950/40 rounded-2xl border border-white/10 backdrop-blur-xl text-center font-outfit">
                <div className="max-w-md p-10 bg-white/5 rounded-[40px] border border-white/10 shadow-2xl space-y-6">
                    <h3 className="text-2xl font-black text-white">The Void is Empty</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">No technology connections detected. Populate the galaxy with articles.</p>
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
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none">Neural Galaxy 2D</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Premium Performance Edition</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pointer-events-auto">
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

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className={`w-12 h-12 border rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 z-50 ${isFullscreen
                                    ? 'bg-cosmic-500/20 border-cosmic-500/30 text-cosmic-400'
                                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                                    }`}
                            >
                                <Maximize2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fgRef.current?.zoomToFit(800, 100)}
                                className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all text-white/70 hover:text-white hover:scale-105 active:scale-95 shadow-xl"
                            >
                                <Compass className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setSimulationRunning(!simulationRunning)}
                                className={`w-12 h-12 border rounded-2xl backdrop-blur-3xl flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${simulationRunning
                                    ? 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                                    : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                    }`}
                            >
                                <Layers className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- INTERACTIVE TOOLTIP --- */}
                {hoverNode && (
                    <div className="absolute top-28 left-8 z-40 p-6 bg-slate-950/90 border border-white/10 rounded-3xl backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-left-4 duration-300 border-l-4"
                        style={{ borderLeftColor: getCategoryColor(hoverNode.category) }}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full shadow-lg"
                                    style={{ backgroundColor: getCategoryColor(hoverNode.category), boxShadow: `0 0 15px ${getCategoryColor(hoverNode.category)}` }} />
                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{hoverNode.id}</h4>
                            </div>
                            <div className="flex gap-10">
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Articles</p>
                                    <p className="text-lg font-bold text-white">{hoverNode.val}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Category</p>
                                    <p className="text-lg font-bold text-white">{hoverNode.category || 'General'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LEGEND --- */}
                <div className="absolute bottom-8 right-8 z-30 pointer-events-none space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <div className="p-5 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl space-y-1.5 shadow-2xl">
                        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                            <div key={cat} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- GRAPH CANVAS --- */}
                <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
                    {/* Visual Atmosphere with DRFT */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_#0a0f1e_0%,_#030712_100%)]" />
                        <div className="absolute top-0 left-0 w-full h-full opacity-40 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-cosmic-drift" />
                    </div>

                    <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}

                        // Performance & Cosmic Physics
                        cooldownTime={simulationRunning ? 15000 : 0}
                        warmupTicks={100}
                        enableNodeDrag={true}
                        d3AlphaDecay={0.01}
                        d3VelocityDecay={0.08}

                        // Links
                        linkWidth={link => highlightLinks.has(link) ? 3 : 1}
                        linkColor={link => highlightLinks.has(link) ? 'rgba(168, 85, 247, 0.8)' : 'rgba(255, 255, 255, 0.03)'}
                        linkDirectionalParticles={1}
                        linkDirectionalParticleWidth={link => highlightLinks.has(link) ? 2 : 0}
                        linkDirectionalParticleSpeed={0.005}
                        linkCurvature={0.15}

                        backgroundColor="rgba(0,0,0,0)"
                        onNodeHover={handleNodeHover}

                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            // Coordinate safety check
                            if (!node || !Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

                            const isHighlighted = highlightNodes.has(node.id);
                            const val = node.val || 5;
                            const radius = (Math.sqrt(val) * 3) * (isHighlighted ? 1.25 : 1);

                            if (!Number.isFinite(radius) || radius <= 0) return;

                            const color = getCategoryColor(node.category);
                            const alpha = hoverNode ? (isHighlighted ? 1 : 0.15) : 1;
                            const time = Date.now() / 1000;

                            // --- 1. SUPERIOR ATMOSPHERIC HALO ---
                            if (isHighlighted || val > 15) {
                                ctx.save();
                                const haloGrad = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 3.5);
                                haloGrad.addColorStop(0, `${color}${Math.floor(alpha * 50).toString(16).padStart(2, '0')}`);
                                haloGrad.addColorStop(0.4, `${color}${Math.floor(alpha * 20).toString(16).padStart(2, '0')}`);
                                haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                                ctx.fillStyle = haloGrad;
                                ctx.globalCompositeOperation = 'screen';
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, radius * 3.5, 0, 2 * Math.PI, false);
                                ctx.fill();
                                ctx.restore();
                            }

                            // --- 2. DYNAMIC ORBITAL RINGS (For high value nodes) ---
                            if (val > 25 || isHighlighted) {
                                ctx.save();
                                const ringAlpha = Math.floor(alpha * (isHighlighted ? 150 : 80)).toString(16).padStart(2, '0');
                                ctx.strokeStyle = `${color}${ringAlpha}`;
                                ctx.lineWidth = 1 / globalScale;

                                // Draw 2 subtle tilted rings
                                const ringRadius = radius * 1.8;
                                ctx.beginPath();
                                ctx.ellipse(node.x, node.y, ringRadius, ringRadius * 0.3, Math.PI / 4 + time * 0.2, 0, 2 * Math.PI);
                                ctx.stroke();

                                if (isHighlighted) {
                                    ctx.beginPath();
                                    ctx.ellipse(node.x, node.y, ringRadius * 1.2, ringRadius * 0.4, -Math.PI / 4 - time * 0.3, 0, 2 * Math.PI);
                                    ctx.stroke();
                                }
                                ctx.restore();
                            }

                            // --- 3. PLANETARY SURFACE LAYERING ---
                            ctx.save();
                            ctx.globalAlpha = alpha;

                            // A. Core Depth (Mantle)
                            const mantleGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
                            mantleGrad.addColorStop(0, color);
                            mantleGrad.addColorStop(0.7, color);
                            mantleGrad.addColorStop(1, '#000000');

                            ctx.beginPath();
                            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                            ctx.fillStyle = mantleGrad;
                            ctx.fill();

                            // B. Surface Texture / Clouds (Simulated with arc layers)
                            ctx.globalCompositeOperation = 'source-atop';
                            const cloudColor = '#ffffff';
                            const cloudAlpha = isHighlighted ? 0.3 : 0.15;
                            ctx.fillStyle = `${cloudColor}${Math.floor(cloudAlpha * 255).toString(16).padStart(2, '0')}`;

                            // Draw 3 "cloud belts"
                            [-0.4, 0, 0.4].forEach(offset => {
                                const yOff = radius * offset;
                                const beltHeight = radius * 0.2;
                                ctx.beginPath();
                                ctx.rect(node.x - radius, node.y + yOff - beltHeight / 2, radius * 2, beltHeight);
                                ctx.fill();
                            });

                            // C. Atmospheric Rim Light (The "Blue Marble" effect)
                            const rimGrad = ctx.createRadialGradient(node.x, node.y, radius * 0.8, node.x, node.y, radius);
                            rimGrad.addColorStop(0, 'rgba(0,0,0,0)');
                            rimGrad.addColorStop(0.8, `${color}44`);
                            rimGrad.addColorStop(1, '#ffffff88');
                            ctx.fillStyle = rimGrad;
                            ctx.fill();

                            // D. Major Specular Highlight
                            const specGrad = ctx.createRadialGradient(node.x - radius / 2.5, node.y - radius / 2.5, 0, node.x - radius / 2.5, node.y - radius / 2.5, radius * 0.8);
                            specGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
                            specGrad.addColorStop(1, 'rgba(255,255,255,0)');
                            ctx.fillStyle = specGrad;
                            ctx.fill();

                            ctx.restore();

                            // --- 4. PREMIUM GLASS-PILL LABELS (Anti-Chaos Smart Density) ---
                            // Aggressive filtering based on zoom level (globalScale)
                            let showLabel = isHighlighted;

                            if (!showLabel) {
                                if (globalScale > 2) showLabel = true; // Show everything when very close
                                else if (globalScale > 1.2) showLabel = val > 5; // Show most nodes
                                else if (globalScale > 0.8) showLabel = val > 15; // Show important
                                else if (globalScale > 0.5) showLabel = val > 40; // Show major landmarks
                                else if (globalScale > 0.3) showLabel = val > 80; // Only giants
                                // Zoom < 0.3: No labels except highlighted
                            }

                            if (showLabel) {
                                const label = node.id;

                                // SCALE-DEPENDENT FONT SIZE
                                // As we zoom out, we make the label visually smaller on screen
                                // so it doesn't consume the entire viewport.
                                const baseFontSize = isHighlighted ? 18 : 14;
                                const scaleFactor = Math.min(1.1, Math.max(0.4, globalScale));
                                const fontSize = (baseFontSize * scaleFactor) / globalScale;

                                ctx.font = `600 ${fontSize}px "Outfit", "Inter", sans-serif`;

                                const textWidth = ctx.measureText(label).width;
                                const paddingH = 10 / globalScale;
                                const paddingV = 5 / globalScale;
                                const pillWidth = textWidth + paddingH * 2 + (8 / globalScale);
                                const pillHeight = fontSize + paddingV * 2;

                                const x = node.x;
                                const y = node.y + radius + (20 / globalScale);

                                ctx.save();
                                // A. Glass Pill Background
                                ctx.beginPath();
                                const r = pillHeight / 2;
                                ctx.moveTo(x - pillWidth / 2 + r, y - pillHeight / 2);
                                ctx.lineTo(x + pillWidth / 2 - r, y - pillHeight / 2);
                                ctx.arcTo(x + pillWidth / 2, y - pillHeight / 2, x + pillWidth / 2, y + pillHeight / 2, r);
                                ctx.lineTo(x + pillWidth / 2 - r, y + pillHeight / 2);
                                ctx.arcTo(x - pillWidth / 2, y + pillHeight / 2, x - pillWidth / 2, y - pillHeight / 2, r);
                                ctx.arcTo(x - pillWidth / 2, y - pillHeight / 2, x + pillWidth / 2, y - pillHeight / 2, r);
                                ctx.closePath();

                                // Glassy fill
                                const glassGrad = ctx.createLinearGradient(x, y - pillHeight / 2, x, y + pillHeight / 2);
                                glassGrad.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
                                glassGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
                                ctx.fillStyle = glassGrad;
                                ctx.fill();

                                // Neon Border
                                ctx.strokeStyle = isHighlighted ? color : `rgba(255, 255, 255, ${alpha * 0.15})`;
                                ctx.lineWidth = (isHighlighted ? 2 : 1) / globalScale;
                                ctx.stroke();

                                // B. Category Bullet
                                const dotRadius = 4 / globalScale;
                                ctx.beginPath();
                                ctx.arc(x - textWidth / 2 - (4 / globalScale), y, dotRadius, 0, 2 * Math.PI);
                                ctx.fillStyle = color;
                                if (isHighlighted) {
                                    ctx.shadowColor = color;
                                    ctx.shadowBlur = 10 / globalScale;
                                }
                                ctx.fill();
                                ctx.shadowBlur = 0;

                                // C. Typography
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = isHighlighted ? '#ffffff' : `rgba(255, 255, 255, ${alpha * 0.95})`;

                                // Subtle shadow for text depth
                                ctx.shadowColor = 'rgba(0,0,0,1)';
                                ctx.shadowBlur = 2 / globalScale;

                                // Shift text slightly to center with bullet
                                ctx.fillText(label, x + (6 / globalScale), y);
                                ctx.restore();
                            }
                        }}

                        onNodeClick={node => {
                            if (fgRef.current) {
                                fgRef.current.centerAt(node.x, node.y, 800);
                                fgRef.current.zoom(3, 1000);
                            }
                            setClickPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                            setSelectedNodeId(node.id);
                        }}
                    />
                </div>
            </div>

            <ArticleJarvisHUD
                nodeId={selectedNodeId}
                onClose={() => setSelectedNodeId(null)}
                position={clickPos}
            />
        </div>
    );
};

export default KnowledgeGraph;
