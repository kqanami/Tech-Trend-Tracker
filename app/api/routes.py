"""API routes for Tech Trend Tracker."""
import logging
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.database import get_db
from app.models.article import Article
from app.models.github_repo import GitHubRepo
from app.models.trend import Trend
from app.models.tag import Tag
from app.services.techcrunch_scraper import TechCrunchScraper
from app.services.github_scraper import GitHubScraper
from app.services.hackernews_scraper import HackerNewsScraper
from app.services.arxiv_scraper import ArXivScraper
from app.services.data_processor import DataProcessor
from app.core.config import settings

from .schemas import (
    ArticleResponse, ArticleListResponse, ArticleFilterParams,
    GitHubRepoResponse, GitHubRepoListResponse, GitHubRepoFilterParams,
    TrendResponse, TrendListResponse, TrendFilterParams,
    DashboardStats, ScrapeRequest, ScrapeResponse, HealthCheck
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=dict, tags=["Info"])
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


@router.get("/health", response_model=HealthCheck, tags=["Info"])
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return HealthCheck(
        status="healthy" if db_status == "connected" else "unhealthy",
        version=settings.APP_VERSION,
        database=db_status,
        timestamp=datetime.utcnow()
    )


# ============================================================================
# Articles
# ============================================================================

@router.get("/articles", response_model=ArticleListResponse, tags=["Articles"])
async def get_articles(
    params: ArticleFilterParams = Depends(),
    db: Session = Depends(get_db)
):
    """Get articles with filtering and pagination."""
    from datetime import datetime
    
    query = db.query(Article)
    
    if params.source:
        query = query.filter(Article.source.ilike(f"%{params.source}%"))
    
    if params.category:
        query = query.filter(Article.category.ilike(f"%{params.category}%"))
    
    if params.author:
        query = query.filter(Article.author.ilike(f"%{params.author}%"))
    
    if params.tag:
        query = query.join(Article.tags).filter(Tag.name.ilike(f"%{params.tag}%"))
    
    if params.search:
        search_filter = f"%{params.search}%"
        query = query.filter(
            (Article.title.ilike(search_filter)) | 
            (Article.summary.ilike(search_filter))
        )
    
    # Date filters
    if params.start_date:
        try:
            start = datetime.fromisoformat(params.start_date)
            query = query.filter(Article.published_at >= start)
        except ValueError:
            pass
    
    if params.end_date:
        try:
            end = datetime.fromisoformat(params.end_date)
            query = query.filter(Article.published_at <= end)
        except ValueError:
            pass
    
    # Sentiment filters
    if params.min_sentiment is not None:
        query = query.filter(Article.sentiment_score >= params.min_sentiment)
    
    if params.max_sentiment is not None:
        query = query.filter(Article.sentiment_score <= params.max_sentiment)
    
    total = query.count()
    
    offset = (params.page - 1) * params.page_size
    articles = query.order_by(desc(Article.published_at)).offset(offset).limit(params.page_size).all()
    
    pages = (total + params.page_size - 1) // params.page_size
    
    return ArticleListResponse(
        items=[article.to_dict() for article in articles],
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=pages,
        has_next=params.page < pages,
        has_prev=params.page > 1
    )


@router.get("/articles/{article_id}", response_model=ArticleResponse, tags=["Articles"])
async def get_article(
    article_id: int = Path(..., description="Article ID"),
    db: Session = Depends(get_db)
):
    """Get a single article by ID."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article.to_dict()


@router.get("/articles/sources/list", response_model=List[str], tags=["Articles"])
async def get_article_sources(db: Session = Depends(get_db)):
    """Get list of unique article sources."""
    sources = db.query(Article.source).distinct().all()
    return [s[0] for s in sources if s[0]]


@router.get("/articles/categories/list", response_model=List[str], tags=["Articles"])
async def get_article_categories(db: Session = Depends(get_db)):
    """Get list of unique article categories."""
    categories = db.query(Article.category).distinct().all()
    return [c[0] for c in categories if c[0]]


# ============================================================================
# GitHub Repositories
# ============================================================================

@router.get("/repos", response_model=GitHubRepoListResponse, tags=["Repositories"])
async def get_repos(
    params: GitHubRepoFilterParams = Depends(),
    db: Session = Depends(get_db)
):
    """Get GitHub repositories with filtering and pagination."""
    query = db.query(GitHubRepo)
    
    if params.language:
        query = query.filter(GitHubRepo.language.ilike(f"%{params.language}%"))
    
    if params.category:
        query = query.filter(GitHubRepo.category.ilike(f"%{params.category}%"))
    
    if params.owner:
        query = query.filter(GitHubRepo.owner.ilike(f"%{params.owner}%"))
    
    if params.min_stars is not None:
        query = query.filter(GitHubRepo.stars >= params.min_stars)
    
    if params.search:
        search_filter = f"%{params.search}%"
        query = query.filter(
            (GitHubRepo.name.ilike(search_filter)) | 
            (GitHubRepo.description.ilike(search_filter)) |
            (GitHubRepo.full_name.ilike(search_filter))
        )
    
    query = query.order_by(desc(GitHubRepo.trending_score))
    
    total = query.count()
    
    offset = (params.page - 1) * params.page_size
    repos = query.offset(offset).limit(params.page_size).all()
    
    pages = (total + params.page_size - 1) // params.page_size
    
    return GitHubRepoListResponse(
        items=[repo.to_dict() for repo in repos],
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=pages,
        has_next=params.page < pages,
        has_prev=params.page > 1
    )


@router.get("/repos/{repo_id}", response_model=GitHubRepoResponse, tags=["Repositories"])
async def get_repo(
    repo_id: int = Path(..., description="Repository ID"),
    db: Session = Depends(get_db)
):
    """Get a single repository by ID."""
    repo = db.query(GitHubRepo).filter(GitHubRepo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo.to_dict()


@router.get("/repos/languages/list", response_model=List[str], tags=["Repositories"])
async def get_repo_languages(db: Session = Depends(get_db)):
    """Get list of unique programming languages."""
    languages = db.query(GitHubRepo.language).distinct().all()
    return sorted([l[0] for l in languages if l[0]])


@router.get("/repos/categories/list", response_model=List[str], tags=["Repositories"])
async def get_repo_categories(db: Session = Depends(get_db)):
    """Get list of unique repository categories."""
    categories = db.query(GitHubRepo.category).distinct().all()
    return [c[0] for c in categories if c[0]]


# ============================================================================
# Trends
# ============================================================================

@router.get("/trends", response_model=TrendListResponse, tags=["Trends"])
async def get_trends(
    params: TrendFilterParams = Depends(),
    db: Session = Depends(get_db)
):
    """Get technology trends with filtering and pagination."""
    query = db.query(Trend)
    
    if params.category:
        query = query.filter(Trend.category.ilike(f"%{params.category}%"))
    
    if params.min_score is not None:
        query = query.filter(Trend.overall_score >= params.min_score)
    
    if params.search:
        query = query.filter(Trend.name.ilike(f"%{params.search}%"))
    
    query = query.order_by(desc(Trend.overall_score))
    
    total = query.count()
    
    offset = (params.page - 1) * params.page_size
    trends = query.offset(offset).limit(params.page_size).all()
    
    pages = (total + params.page_size - 1) // params.page_size
    
    return TrendListResponse(
        items=[trend.to_dict() for trend in trends],
        total=total,
        page=params.page,
        page_size=params.page_size,
        pages=pages,
        has_next=params.page < pages,
        has_prev=params.page > 1
    )


@router.get("/trends/{trend_id}", response_model=TrendResponse, tags=["Trends"])
async def get_trend(
    trend_id: int = Path(..., description="Trend ID"),
    db: Session = Depends(get_db)
):
    """Get a single trend by ID."""
    trend = db.query(Trend).filter(Trend.id == trend_id).first()
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    return trend.to_dict()


@router.get("/trends/categories/list", response_model=List[str], tags=["Trends"])
async def get_trend_categories(db: Session = Depends(get_db)):
    """Get list of unique trend categories."""
    categories = db.query(Trend.category).distinct().all()
    return [c[0] for c in categories if c[0]]


# ============================================================================
# Dashboard
# ============================================================================

@router.get("/dashboard/stats", response_model=DashboardStats, tags=["Dashboard"])
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics."""
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    total_articles = db.query(Article).count()
    total_repos = db.query(GitHubRepo).count()
    total_trends = db.query(Trend).count()
    total_tags = db.query(Tag).count()
    
    articles_today = db.query(Article).filter(Article.scraped_at >= today_start).count()
    repos_today = db.query(GitHubRepo).filter(GitHubRepo.scraped_at >= today_start).count()
    
    top_sources = db.query(
        Article.source,
        func.count(Article.id).label('count')
    ).group_by(Article.source).order_by(desc('count')).limit(5).all()
    
    top_languages = db.query(
        GitHubRepo.language,
        func.count(GitHubRepo.id).label('count'),
        func.sum(GitHubRepo.stars).label('total_stars')
    ).filter(GitHubRepo.language.isnot(None)).group_by(
        GitHubRepo.language
    ).order_by(desc('count')).limit(5).all()
    
    trending_now = db.query(Trend).order_by(desc(Trend.overall_score)).limit(10).all()
    
    return DashboardStats(
        total_articles=total_articles,
        total_repos=total_repos,
        total_trends=total_trends,
        total_tags=total_tags,
        articles_today=articles_today,
        repos_today=repos_today,
        top_sources=[{"name": s[0], "count": s[1]} for s in top_sources],
        top_languages=[{"name": l[0], "count": l[1], "stars": l[2] or 0} for l in top_languages],
        trending_now=[t.to_dict() for t in trending_now]
    )


# ============================================================================
# Scraping
# ============================================================================

@router.post("/scrape", response_model=ScrapeResponse, tags=["Scraping"])
async def trigger_scraping(
    request: ScrapeRequest,
    db: Session = Depends(get_db)
):
    """Trigger data scraping from sources."""
    articles_created = 0
    repos_created = 0
    errors = []
    
    processor = DataProcessor(db)
    
    if request.source in ["techcrunch", "all"]:
        try:
            logger.info("Starting TechCrunch scraping...")
            scraper = TechCrunchScraper()
            # Only get recent articles (last 7 days) to avoid duplicates
            articles = scraper.scrape_all_categories(
                limit_per_category=request.limit // 3,
                only_recent=True,
                days_back=7
            )
            
            logger.info(f"📊 Scraped {len(articles)} articles from TechCrunch, checking for new ones...")
            
            skipped_count = 0
            for article_data in articles:
                result = processor.process_article(article_data)
                # Only count if result is not None (None means article already exists)
                if result is not None:
                    articles_created += 1
                else:
                    skipped_count += 1
            
            logger.info(f"✅ TechCrunch scraping completed: {articles_created} NEW articles created, {skipped_count} duplicates skipped")
        except Exception as e:
            error_msg = f"TechCrunch scraping error: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
    
    if request.source in ["hackernews", "all"]:
        try:
            logger.info("Starting HackerNews scraping...")
            scraper = HackerNewsScraper()
            articles = scraper.scrape_latest(limit=request.limit // 2)
            
            hn_count = 0
            for article_data in articles:
                result = processor.process_article(article_data)
                if result:
                    hn_count += 1
                    articles_created += 1
            
            logger.info(f"HackerNews scraping completed: {hn_count} articles")
        except Exception as e:
            error_msg = f"HackerNews scraping error: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)

    if request.source in ["arxiv", "all"]:
        try:
            logger.info("Starting ArXiv scraping...")
            scraper = ArXivScraper()
            articles = scraper.scrape_latest(limit=request.limit // 2)
            
            arxiv_count = 0
            for article_data in articles:
                result = processor.process_article(article_data)
                if result:
                    arxiv_count += 1
                    articles_created += 1
            
            logger.info(f"ArXiv scraping completed: {arxiv_count} articles")
        except Exception as e:
            error_msg = f"ArXiv scraping error: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
    
    if request.source in ["github", "all"]:
        try:
            logger.info("Starting GitHub scraping...")
            scraper = GitHubScraper()
            repos = scraper.scrape_all_languages(limit_per_lang=request.limit // 5)
            
            for repo_data in repos:
                result = processor.process_github_repo(repo_data)
                if result:
                    repos_created += 1
            
            logger.info(f"GitHub scraping completed: {repos_created} repos")
        except Exception as e:
            error_msg = f"GitHub scraping error: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
    
    try:
        processor.calculate_trends()
    except Exception as e:
        errors.append(f"Trend calculation error: {str(e)}")
    
    success = len(errors) == 0 or (articles_created > 0 or repos_created > 0)
    
    return ScrapeResponse(
        success=success,
        message=f"Scraping completed. Created {articles_created} articles and {repos_created} repos.",
        articles_created=articles_created,
        repos_created=repos_created,
        errors=errors
    )



