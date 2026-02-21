import axios from 'axios'

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
    }
)

export interface Article {
    id: number
    title: string
    url: string
    source: string
    author?: string
    summary?: string
    published_at?: string
    scraped_at: string
    category?: string
    image_url?: string
    sentiment_score?: number
    technical_analysis?: string
    tags?: string[]
}

export interface Repository {
    id: number
    name: string
    full_name: string
    owner: string
    url: string
    description?: string
    language?: string
    topics?: string[]
    stars: number
    forks: number
    open_issues: number
    trending_score: number
    stars_today?: number
}

export interface Trend {
    id: number
    name: string
    slug: string
    category: string
    description?: string
    mention_count: number
    article_count: number
    repo_count: number
    popularity_score: number
    growth_score: number
    overall_score: number
    calculated_at: string
}

export interface DashboardStats {
    total_articles: number
    total_repos: number
    total_trends: number
    total_tags: number
    articles_today: number
    repos_today: number
    top_sources: Array<{ name: string; count: number }>
    top_languages: Array<{ name: string; count: number; stars: number }>
    trending_now: Trend[]
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    page_size: number
    pages: number
    has_next: boolean
    has_prev: boolean
}

// API functions
export const dashboardAPI = {
    getStats: () => api.get<DashboardStats>('/dashboard/stats'),
}

export const articlesAPI = {
    getAll: (params?: {
        page?: number
        page_size?: number
        source?: string
        category?: string
        tag?: string
        search?: string
    }) => api.get<PaginatedResponse<Article>>('/articles', { params }),

    getById: (id: number) => api.get<Article>(`/articles/${id}`),

    getSources: () => api.get<string[]>('/articles/sources/list'),

    getCategories: () => api.get<string[]>('/articles/categories/list'),
}

export const repositoriesAPI = {
    getAll: (params?: {
        page?: number
        page_size?: number
        language?: string
        category?: string
        min_stars?: number
        search?: string
    }) => api.get<PaginatedResponse<Repository>>('/repos', { params }),

    getById: (id: number) => api.get<Repository>(`/repos/${id}`),

    getLanguages: () => api.get<string[]>('/repos/languages/list'),
}

export const trendsAPI = {
    getAll: (params?: {
        page?: number
        page_size?: number
        category?: string
        min_score?: number
        search?: string
    }) => api.get<PaginatedResponse<Trend>>('/trends', { params }),

    getById: (id: number) => api.get<Trend>(`/trends/${id}`),

    getCategories: () => api.get<string[]>('/trends/categories/list'),
}

export const searchAPI = {
    vectorSearch: (query: string, limit: number = 10) =>
        api.get<Article[]>('/search/vector', { params: { q: query, limit } }),
    
    hybridSearch: (query: string, limit: number = 10, vectorWeight: number = 0.7, keywordWeight: number = 0.3) =>
        api.get<{
            query: string
            vector_results: Article[]
            keyword_results: Article[]
            combined_results: (Article & { combined_score: number; type: string })[]
        }>('/search/hybrid', { params: { q: query, limit, vector_weight: vectorWeight, keyword_weight: keywordWeight } }),
    
    findSimilar: (articleId: number, limit: number = 5) =>
        api.get<(Article & { similarity_score: number })[]>(`/search/similar/${articleId}`, { params: { limit } }),
}

export interface TrendHistory {
    id: number
    trend_id: number
    recorded_at: string
    mention_count: number
    article_count: number
    repo_count: number
    popularity_score: number
    growth_score: number
    overall_score: number
    avg_sentiment?: number
    new_mentions: number
}

export interface TrendPrediction {
    trend_id: number
    predicted_score: number
    current_score: number
    confidence: number
    direction: 'up' | 'down' | 'stable'
    growth_rate: number
    days_ahead: number
}

export interface TrendInsights {
    trend: Trend
    history_points: number
    momentum: number
    prediction: TrendPrediction
    related_trends: Trend[]
    top_articles: Article[]
    top_repos: Repository[]
    avg_sentiment?: number
}

export interface TrendComparison {
    trends: Trend[]
    metrics: {
        highest_score?: string
        fastest_growing?: string
        most_mentioned?: string
    }
}

export const analyticsAPI = {
    getTrendHistory: (trendId: number, days: number = 30) =>
        api.get<{ trend_id: number; days: number; data_points: number; history: TrendHistory[] }>(
            `/analytics/trends/${trendId}/history`,
            { params: { days } }
        ),
    
    predictTrend: (trendId: number, daysAhead: number = 7) =>
        api.get<TrendPrediction>(`/analytics/trends/${trendId}/predict`, { params: { days_ahead: daysAhead } }),
    
    getTrendInsights: (trendId: number) =>
        api.get<TrendInsights>(`/analytics/trends/${trendId}/insights`),
    
    getRelatedTrends: (trendId: number, limit: number = 5) =>
        api.get<{ trend_id: number; related_trends: Trend[] }>(`/analytics/trends/${trendId}/related`, { params: { limit } }),
    
    compareTrends: (trendIds: number[]) =>
        api.post<TrendComparison>('/analytics/trends/compare', trendIds),
    
    getEmergingTrends: (days: number = 7, minGrowth: number = 10, limit: number = 10) =>
        api.get<{
            days: number
            min_growth: number
            trends: Array<{
                trend_id: number
                name: string
                category: string
                current_score: number
                growth_rate: number
                score_change: number
            }>
        }>('/analytics/trends/emerging', { params: { days, min_growth: minGrowth, limit } }),
    
    getRecommendations: (interests?: string, limit: number = 10) =>
        api.get<{
            type: 'popular' | 'personalized'
            interests?: string[]
            recommendations: Trend[]
        }>('/analytics/recommendations', { params: { interests, limit } }),
}

export const graphAPI = {
    getGraphData: (minWeight: number = 1, limit: number = 500, category?: string) =>
        api.get<{
            nodes: Array<{ id: string; val: number; group: string; category?: string }>
            links: Array<{ source: string; target: string; value: number }>
            total_nodes: number
            total_links: number
        }>('/graph/data', { params: { min_weight: minWeight, limit, category } }),
    
    getTrendConnections: (trendName: string, limit: number = 10) =>
        api.get<{
            trend: string
            trend_info?: Trend
            total_articles: number
            connections: Array<{ name: string; count: number; strength: number }>
            strongest_connection?: { name: string; count: number; strength: number }
        }>(`/graph/connections/${encodeURIComponent(trendName)}`, { params: { limit } }),
    
    getClusterAnalysis: (minConnections: number = 3) =>
        api.get<{
            clusters: Array<{ technologies: string[]; size: number; avg_connections: number }>
            total_clusters: number
            min_connections: number
        }>('/graph/cluster-analysis', { params: { min_connections: minConnections } }),
}

export const exportAPI = {
    exportArticlesCSV: (params?: {
        source?: string
        category?: string
        start_date?: string
        end_date?: string
        limit?: number
    }) => api.get('/export/articles/csv', { params, responseType: 'blob' }),
    
    exportArticlesJSON: (params?: {
        source?: string
        category?: string
        start_date?: string
        end_date?: string
        limit?: number
    }) => api.get('/export/articles/json', { params, responseType: 'blob' }),
    
    exportTrendsCSV: (params?: {
        category?: string
        min_score?: number
        limit?: number
    }) => api.get('/export/trends/csv', { params, responseType: 'blob' }),
    
    exportReposCSV: (params?: {
        language?: string
        min_stars?: number
        limit?: number
    }) => api.get('/export/repos/csv', { params, responseType: 'blob' }),
    
    exportStatsSummary: (days?: number) => api.get('/export/stats/summary', { params: { days }, responseType: 'blob' }),
}

export const statisticsAPI = {
    getSourcesPerformance: (days: number = 30) =>
        api.get<{
            period_days: number
            sources: Array<{
                name: string
                total_articles: number
                avg_sentiment: number
                first_article: string | null
                last_article: string | null
            }>
        }>('/stats/sources/performance', { params: { days } }),
    
    getCategoriesTrending: (days: number = 7) =>
        api.get<{
            period_days: number
            trending_categories: Array<{
                category: string
                count: number
                previous_count: number
                growth: number
            }>
        }>('/stats/categories/trending', { params: { days } }),
    
    getTimeSeries: (metric: string = 'articles', days: number = 30, groupBy: string = 'day') =>
        api.get<{
            metric: string
            period_days: number
            group_by: string
            data: Array<{ date: string; count: number }>
        }>('/stats/time-series', { params: { metric, days, group_by: groupBy } }),
    
    comparePeriods: (period1Days: number = 7, period2Days: number = 7) =>
        api.get<{
            period1: { start: string; end: string; days: number; articles: number; repos: number }
            period2: { start: string; end: string; days: number; articles: number; repos: number }
            changes: {
                articles: { absolute: number; percentage: number }
                repos: { absolute: number; percentage: number }
            }
        }>('/stats/comparison', { params: { period1_days: period1Days, period2_days: period2Days } }),
}

export const favoritesAPI = {
    addFavorite: (itemType: string, itemId: number) =>
        api.post('/favorites', { item_type: itemType, item_id: itemId }),
    
    validateFavorites: (itemIds: string, itemType: string = 'article') =>
        api.get<{ valid_ids: number[]; invalid_ids: number[] }>('/favorites/validate', {
            params: { item_ids: itemIds, item_type: itemType },
        }),
}

export default api
