import { useQuery } from '@tanstack/react-query'
import { searchAPI } from '../api/client'
import { Sparkles, ExternalLink } from 'lucide-react'

interface SimilarArticlesProps {
    articleId: number
}

export default function SimilarArticles({ articleId }: SimilarArticlesProps) {
    const { data: similar, isLoading } = useQuery({
        queryKey: ['similar-articles', articleId],
        queryFn: async () => {
            const response = await searchAPI.findSimilar(articleId, 3)
            return response.data
        },
        enabled: !!articleId,
    })

    if (isLoading || !similar || similar.length === 0) {
        return null
    }

    return (
        <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-cosmic-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Similar Articles</h4>
            </div>
            <div className="space-y-3">
                {similar.map((article) => (
                    <a
                        key={article.id}
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                        <h5 className="text-sm font-bold text-white mb-1 group-hover:text-cosmic-300 transition-colors line-clamp-1">
                            {article.title}
                        </h5>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{article.summary}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">{article.source}</span>
                            <span className="text-[10px] text-cosmic-400">
                                {(article.similarity_score * 100).toFixed(0)}% similar
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}

