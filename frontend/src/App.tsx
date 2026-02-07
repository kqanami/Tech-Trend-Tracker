import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Articles from './pages/Articles'
import Repositories from './pages/Repositories'
import Trends from './pages/Trends'

function App() {
    return (
        <div className="min-h-screen bg-space-gradient">
            {/* Cosmic background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-cosmic-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-nebula-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
            </div>

            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/articles" element={<Articles />} />
                    <Route path="/repositories" element={<Repositories />} />
                    <Route path="/trends" element={<Trends />} />
                </Routes>
            </Layout>
        </div>
    )
}

export default App
