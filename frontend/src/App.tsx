import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Articles from './pages/Articles'
import Repositories from './pages/Repositories'
import Trends from './pages/Trends'
import TrendDetail from './pages/TrendDetail'
import TrendCompare from './pages/TrendCompare'
import Recommendations from './pages/Recommendations'
import EmergingTrends from './pages/EmergingTrends'
import SemanticSearch from './pages/SemanticSearch'
import Statistics from './pages/Statistics'
import Export from './pages/Export'
import Favorites from './pages/Favorites'
import Admin from './pages/Admin'
import { useEffect, useState } from 'react'

const StarField = () => {
    const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; delay: string; duration: string }[]>([])

    useEffect(() => {
        const generatedStars = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 3 + 1}px`,
            delay: `${Math.random() * 5}s`,
            duration: `${Math.random() * 3 + 2}s`
        }))
        setStars(generatedStars)
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none transform translate-z-0">
            {stars.map(star => (
                <div
                    key={star.id}
                    className="star absolute bg-white rounded-full opacity-40"
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        animation: `shimmer ${star.duration} infinite ${star.delay}`
                    }}
                />
            ))}
        </div>
    )
}

function App() {
    return (
        <div className="min-h-screen bg-space-950 font-sans selection:bg-cosmic-500/30">
            <StarField />
            {/* Cosmic background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cosmic-500/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-nebula-500/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <Layout>
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
            </Layout>
        </div>
    )
}

export default App
