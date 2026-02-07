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

export default api
