import { Routes, Route, useLocation } from 'react-router-dom'
import { lazy, Suspense, memo } from 'react'
import Layout from './components/Layout'

// ── Eager-loaded (critical path) ──────────────────────────────────────────────
import Dashboard from './pages/Dashboard'

// ── Lazy-loaded (split bundles) ───────────────────────────────────────────────
const Articles = lazy(() => import('./pages/Articles'))
const Repositories = lazy(() => import('./pages/Repositories'))
const Trends = lazy(() => import('./pages/Trends'))
const TrendDetail = lazy(() => import('./pages/TrendDetail'))
const TrendCompare = lazy(() => import('./pages/TrendCompare'))
const Recommendations = lazy(() => import('./pages/Recommendations'))
const EmergingTrends = lazy(() => import('./pages/EmergingTrends'))
const SemanticSearch = lazy(() => import('./pages/SemanticSearch'))
const Statistics = lazy(() => import('./pages/Statistics'))
const Export = lazy(() => import('./pages/Export'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Admin = lazy(() => import('./pages/Admin'))

// ── Minimal loading fallback ──────────────────────────────────────────────────
const PageLoader = () => (
    <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-3 border-cosmic-500/20 border-t-cosmic-500 rounded-full animate-spin" />
    </div>
)

// ── Stars: reduced count, uses CSS only (no JS re-renders) ────────────────────
const StarField = memo(() => (
    <div className="fixed inset-0 pointer-events-none will-change-auto" style={{ zIndex: 0 }}>
        {Array.from({ length: 20 }).map((_, i) => (
            <div
                key={i}
                className="absolute bg-white rounded-full opacity-30"
                style={{
                    top: `${(i * 37 + 13) % 100}%`,
                    left: `${(i * 53 + 7) % 100}%`,
                    width: `${(i % 3) + 1}px`,
                    height: `${(i % 3) + 1}px`,
                    animation: `shimmer ${3 + (i % 4)}s infinite ${(i % 5)}s`,
                }}
            />
        ))}
    </div>
))

function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/repositories" element={<Repositories />} />
                <Route path="/trends" element={<Trends />} />
                <Route path="/trends/:id" element={<TrendDetail />} />
                <Route path="/compare" element={<TrendCompare />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/emerging" element={<EmergingTrends />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/export" element={<Export />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/search" element={<SemanticSearch />} />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </Suspense>
    )
}

function App() {
    return (
        <div className="min-h-screen bg-space-950 font-sans selection:bg-cosmic-500/30">
            <StarField />
            {/* Lightweight ambient glow — no blur, just opacity gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30" style={{ zIndex: 0 }}>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cosmic-500/15 rounded-full" style={{ filter: 'blur(80px)' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-nebula-500/15 rounded-full" style={{ filter: 'blur(80px)' }} />
            </div>

            <Layout>
                <AppRoutes />
            </Layout>
        </div>
    )
}

export default App
