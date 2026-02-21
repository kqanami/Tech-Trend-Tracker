import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../api/client'
import { Sparkles, TrendingUp, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Recommendations() {
    const navigate = useNavigate()
    const [interests, setInterests] = useState<string[]>([])
    const [inputValue, setInputValue] = useState('')

    const { data: recommendations, isLoading } = useQuery({
        queryKey: ['recommendations', interests.join(',')],
        queryFn: async () => {
            const interestsStr = interests.length > 0 ? interests.join(',') : undefined
            const response = await analyticsAPI.getRecommendations(interestsStr, 20)
            return response.data
        },
    })

    const addInterest = () => {
        if (inputValue.trim() && !interests.includes(inputValue.trim().toLowerCase())) {
            setInterests([...interests, inputValue.trim().toLowerCase()])
            setInputValue('')
        }
    }

    const removeInterest = (interest: string) => {
        setInterests(interests.filter((i) => i !== interest))
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addInterest()
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-5xl font-extrabold gradient-text tracking-tight flex items-center justify-center gap-4">
                    <Sparkles className="w-12 h-12 text-purple-500" />
                    Personalized Recommendations
                </h1>
                <p className="mt-4 text-gray-400 font-light max-w-2xl mx-auto">
                    Tell us what you're interested in, and we'll recommend the most relevant technology trends for you.
                </p>
            </div>

            {/* Interest Input */}
            <div className="cosmic-card">
                <h3 className="text-xl font-bold text-white mb-4">Your Interests</h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="e.g. machine learning, python, blockchain..."
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button
                        onClick={addInterest}
                        className="px-6 py-3 bg-purple-500/20 border border-purple-500/50 rounded-xl text-purple-300 font-bold hover:bg-purple-500/30 transition-colors"
                    >
                        Add
                    </button>
                </div>

                {/* Selected Interests */}
                {interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                            <div
                                key={interest}
                                className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg"
                            >
                                <span className="text-sm font-bold text-white capitalize">{interest}</span>
                                <button
                                    onClick={() => removeInterest(interest)}
                                    className="hover:bg-purple-500/30 rounded p-0.5 transition-colors"
                                >
                                    <X className="w-3 h-3 text-purple-300" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {interests.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                        No interests selected. Showing popular trends.
                    </p>
                )}
            </div>

            {/* Recommendations */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
            ) : recommendations ? (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {recommendations.type === 'personalized' ? 'Personalized Recommendations' : 'Popular Trends'}
                        </h2>
                        <span className="text-sm text-gray-400">
                            {recommendations.recommendations.length} trends
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.recommendations.map((trend) => (
                            <div
                                key={trend.id}
                                className="cosmic-card group cursor-pointer hover:scale-[1.02] transition-transform"
                                onClick={() => navigate(`/trends/${trend.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                            {trend.name}
                                        </h3>
                                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 uppercase">
                                            {trend.category}
                                        </span>
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-purple-400" />
                                </div>

                                {trend.description && (
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{trend.description}</p>
                                )}

                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Score</span>
                                        <span className="font-bold text-white">{trend.overall_score.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Mentions</span>
                                        <span className="font-bold text-white">{trend.mention_count}</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-gradient"
                                            style={{ width: `${trend.overall_score}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center text-xs text-purple-400 font-bold group-hover:text-purple-300 transition-colors">
                                    View Details
                                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

