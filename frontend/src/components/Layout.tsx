import { ReactNode, useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    Rocket, TrendingUp, Newspaper, Github, Menu, X, Settings,
    Search, Sparkles, BarChart3, Zap, Download, BarChart, Heart,
    ChevronDown, MoreHorizontal
} from 'lucide-react'

interface LayoutProps {
    children: ReactNode
}

const primaryNav = [
    { name: 'Dashboard', href: '/', icon: Rocket },
    { name: 'Articles', href: '/articles', icon: Newspaper },
    { name: 'Repos', href: '/repositories', icon: Github },
    { name: 'Trends', href: '/trends', icon: TrendingUp },
    { name: 'Emerging', href: '/emerging', icon: Zap },
    { name: 'Search', href: '/search', icon: Search },
]

const moreNav = [
    { name: 'Compare', href: '/compare', icon: BarChart3 },
    { name: 'Recommendations', href: '/recommendations', icon: Sparkles },
    { name: 'Statistics', href: '/statistics', icon: BarChart },
    { name: 'Export', href: '/export', icon: Download },
    { name: 'Favorites', href: '/favorites', icon: Heart },
    { name: 'Admin', href: '/admin', icon: Settings },
]

const allNav = [...primaryNav, ...moreNav]

export default function Layout({ children }: LayoutProps) {
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [moreOpen, setMoreOpen] = useState(false)
    const moreRef = useRef<HTMLDivElement>(null)

    // Close "More" dropdown when clicking outside
    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    const isMoreActive = moreNav.some(item => item.href === location.pathname)

    return (
        <div className="relative min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-dark border-b border-white/10">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">

                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group shrink-0">
                            <div className="relative">
                                <Rocket className="w-7 h-7 text-cosmic-400 group-hover:text-cosmic-300 transition-colors" />
                                <div className="absolute inset-0 blur-xl bg-cosmic-400/30 group-hover:bg-cosmic-300/40 transition-all" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-bold gradient-text leading-tight whitespace-nowrap">Tech Trend Tracker</h1>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Cosmic Edition</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
                            {primaryNav.map((item) => {
                                const isActive = location.pathname === item.href
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-semibold whitespace-nowrap ${isActive
                                            ? 'bg-white/10 text-white shadow-cosmic border border-white/10'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}

                            {/* More dropdown */}
                            <div ref={moreRef} className="relative">
                                <button
                                    onClick={() => setMoreOpen(v => !v)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-semibold whitespace-nowrap ${isMoreActive || moreOpen
                                        ? 'bg-white/10 text-white shadow-cosmic border border-white/10'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <MoreHorizontal className="w-4 h-4 shrink-0" />
                                    <span>More</span>
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown panel */}
                                {moreOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-52 glass-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-1.5 space-y-0.5">
                                            {moreNav.map((item) => {
                                                const isActive = location.pathname === item.href
                                                const Icon = item.icon
                                                return (
                                                    <Link
                                                        key={item.name}
                                                        to={item.href}
                                                        onClick={() => setMoreOpen(false)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-semibold ${isActive
                                                            ? 'bg-cosmic-500/20 text-cosmic-300 border border-cosmic-500/20'
                                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <Icon className="w-4 h-4 shrink-0" />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </nav>

                        {/* Mobile menu button */}
                        <button
                            className="lg:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10 shrink-0"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-white/10 glass-dark">
                        <nav className="px-4 py-4 grid grid-cols-2 gap-1.5">
                            {allNav.map((item) => {
                                const isActive = location.pathname === item.href
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${isActive
                                            ? 'bg-cosmic-500/20 text-cosmic-300 border border-cosmic-500/20'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-auto border-t border-white/10 glass-dark">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <p className="text-gray-400 text-sm">
                            © 2026 Tech Trend Tracker · Cosmic Edition v2.0
                        </p>
                        <div className="flex items-center space-x-4 mt-4 md:mt-0">
                            <a href="/api/v1/docs" target="_blank" className="text-gray-400 hover:text-cosmic-400 text-sm transition-colors">
                                API Docs
                            </a>
                            <span className="text-gray-600">•</span>
                            <a href="https://github.com" target="_blank" className="text-gray-400 hover:text-cosmic-400 text-sm transition-colors">
                                GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
