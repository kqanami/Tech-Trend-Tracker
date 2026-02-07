import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Rocket, TrendingUp, Newspaper, Github, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
    children: ReactNode
}

const navigation = [
    { name: 'Dashboard', href: '/', icon: Rocket },
    { name: 'Articles', href: '/articles', icon: Newspaper },
    { name: 'Repositories', href: '/repositories', icon: Github },
    { name: 'Trends', href: '/trends', icon: TrendingUp },
]

export default function Layout({ children }: LayoutProps) {
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="relative min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-dark border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <Rocket className="w-8 h-8 text-cosmic-400 group-hover:text-cosmic-300 transition-colors" />
                                <div className="absolute inset-0 blur-xl bg-cosmic-400/30 group-hover:bg-cosmic-300/40 transition-all" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold gradient-text">Tech Trend Tracker</h1>
                                <p className="text-xs text-gray-400">Cosmic Edition</p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${isActive
                                                ? 'bg-cosmic-gradient text-white shadow-cosmic'
                                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 text-gray-400 hover:text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-white/10">
                        <nav className="px-4 py-4 space-y-2">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                                                ? 'bg-cosmic-gradient text-white'
                                                : 'text-gray-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="relative z-10 mt-auto border-t border-white/10 glass-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <p className="text-gray-400 text-sm">
                            © 2026 Tech Trend Tracker. Cosmic Edition v2.0
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
