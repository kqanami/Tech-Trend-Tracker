"""Pydantic schemas for API requests and responses."""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Base paginated response."""
    total: int
    page: int
    page_size: int
    pages: int
    has_next: bool
    has_prev: bool


class ArticleResponse(BaseModel):
    id: int
    title: str
    url: str
    source: str
    author: Optional[str]
    summary: Optional[str]
    published_at: Optional[str]
    scraped_at: Optional[str]
    category: Optional[str]
    image_url: Optional[str]
    sentiment_score: Optional[float]
    tags: List[str] = []


class ArticleListResponse(PaginatedResponse):
    items: List[ArticleResponse]


class ArticleFilterParams(PaginationParams):
    source: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    tag: Optional[str] = None
    search: Optional[str] = None


class GitHubRepoResponse(BaseModel):
    id: int
    repo_id: Optional[int]
    name: str
    full_name: str
    owner: str
    url: str
    description: Optional[str]
    language: Optional[str]
    topics: List[str] = []
    stars: int
    forks: int
    open_issues: int
    watchers: int
    stars_today: int
    stars_week: int
    stars_month: int
    trending_score: float
    category: Optional[str]
    license: Optional[str]
    created_at: Optional[str]
    pushed_at: Optional[str]
    scraped_at: Optional[str]


class GitHubRepoListResponse(PaginatedResponse):
    items: List[GitHubRepoResponse]


class GitHubRepoFilterParams(PaginationParams):
    language: Optional[str] = None
    category: Optional[str] = None
    owner: Optional[str] = None
    min_stars: Optional[int] = None
    search: Optional[str] = None


class TrendResponse(BaseModel):
    id: int
    name: str
    slug: str
    category: str
    description: Optional[str]
    mention_count: int
    article_count: int
    repo_count: int
    popularity_score: float
    growth_score: float
    overall_score: float
    first_seen_at: Optional[str]
    last_seen_at: Optional[str]


class TrendListResponse(PaginatedResponse):
    items: List[TrendResponse]


class TrendFilterParams(PaginationParams):
    category: Optional[str] = None
    min_score: Optional[float] = None
    search: Optional[str] = None


class DashboardStats(BaseModel):
    total_articles: int
    total_repos: int
    total_trends: int
    total_tags: int
    articles_today: int
    repos_today: int
    top_sources: List[dict]
    top_languages: List[dict]
    trending_now: List[TrendResponse]


class ScrapeRequest(BaseModel):
    source: str = "all"  # techcrunch, github, all
    limit: int = 20


class ScrapeResponse(BaseModel):
    success: bool
    message: str
    articles_created: int = 0
    repos_created: int = 0
    errors: List[str] = []


class HealthCheck(BaseModel):
    status: str
    version: str
    database: str
    timestamp: datetime
