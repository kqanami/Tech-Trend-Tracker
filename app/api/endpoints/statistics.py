"""Statistics and analytics endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.article import Article
from app.models.github_repo import GitHubRepo
from app.models.trend import Trend

router = APIRouter()


@router.get("/sources/performance", tags=["Statistics"])
async def get_sources_performance(
    days: int = Query(30, ge=1, le=365, description="Number of days"),
    db: Session = Depends(get_db)
):
    """Get performance statistics for each source."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    sources = db.query(
        Article.source,
        func.count(Article.id).label('total_articles'),
        func.avg(Article.sentiment_score).label('avg_sentiment'),
        func.min(Article.published_at).label('first_article'),
        func.max(Article.published_at).label('last_article')
    ).filter(
        Article.published_at >= cutoff_date
    ).group_by(Article.source).order_by(desc('total_articles')).all()
    
    return {
        "period_days": days,
        "sources": [
            {
                "name": s[0],
                "total_articles": s[1],
                "avg_sentiment": round(float(s[2] or 0), 3),
                "first_article": s[3].isoformat() if s[3] else None,
                "last_article": s[4].isoformat() if s[4] else None
            }
            for s in sources
        ]
    }


@router.get("/categories/trending", tags=["Statistics"])
async def get_categories_trending(
    days: int = Query(7, ge=1, le=30, description="Number of days"),
    db: Session = Depends(get_db)
):
    """Get trending categories over time."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get category counts for recent period
    recent = db.query(
        Article.category,
        func.count(Article.id).label('count')
    ).filter(
        Article.published_at >= cutoff_date,
        Article.category.isnot(None)
    ).group_by(Article.category).order_by(desc('count')).all()
    
    # Get category counts for previous period (for comparison)
    prev_cutoff = cutoff_date - timedelta(days=days)
    previous = db.query(
        Article.category,
        func.count(Article.id).label('count')
    ).filter(
        and_(
            Article.published_at >= prev_cutoff,
            Article.published_at < cutoff_date
        ),
        Article.category.isnot(None)
    ).group_by(Article.category).all()
    
    prev_dict = {cat[0]: cat[1] for cat in previous}
    
    trending = []
    for cat, count in recent:
        prev_count = prev_dict.get(cat, 0)
        growth = ((count - prev_count) / prev_count * 100) if prev_count > 0 else 100
        
        trending.append({
            "category": cat,
            "count": count,
            "previous_count": prev_count,
            "growth": round(growth, 2)
        })
    
    trending.sort(key=lambda x: x["growth"], reverse=True)
    
    return {
        "period_days": days,
        "trending_categories": trending
    }


@router.get("/time-series", tags=["Statistics"])
async def get_time_series(
    metric: str = Query("articles", description="Metric: articles, repos, trends"),
    days: int = Query(30, ge=1, le=365, description="Number of days"),
    group_by: str = Query("day", description="Group by: day, week, month"),
    db: Session = Depends(get_db)
):
    """Get time series data for various metrics."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    if metric == "articles":
        if group_by == "day":
            query = db.query(
                func.date(Article.published_at).label('date'),
                func.count(Article.id).label('count')
            ).filter(
                Article.published_at >= cutoff_date
            ).group_by(func.date(Article.published_at)).order_by('date')
        elif group_by == "week":
            query = db.query(
                func.date_trunc('week', Article.published_at).label('date'),
                func.count(Article.id).label('count')
            ).filter(
                Article.published_at >= cutoff_date
            ).group_by(func.date_trunc('week', Article.published_at)).order_by('date')
        else:  # month
            query = db.query(
                func.date_trunc('month', Article.published_at).label('date'),
                func.count(Article.id).label('count')
            ).filter(
                Article.published_at >= cutoff_date
            ).group_by(func.date_trunc('month', Article.published_at)).order_by('date')
        
        results = query.all()
        
    elif metric == "repos":
        if group_by == "day":
            query = db.query(
                func.date(GitHubRepo.scraped_at).label('date'),
                func.count(GitHubRepo.id).label('count')
            ).filter(
                GitHubRepo.scraped_at >= cutoff_date
            ).group_by(func.date(GitHubRepo.scraped_at)).order_by('date')
        elif group_by == "week":
            query = db.query(
                func.date_trunc('week', GitHubRepo.scraped_at).label('date'),
                func.count(GitHubRepo.id).label('count')
            ).filter(
                GitHubRepo.scraped_at >= cutoff_date
            ).group_by(func.date_trunc('week', GitHubRepo.scraped_at)).order_by('date')
        else:  # month
            query = db.query(
                func.date_trunc('month', GitHubRepo.scraped_at).label('date'),
                func.count(GitHubRepo.id).label('count')
            ).filter(
                GitHubRepo.scraped_at >= cutoff_date
            ).group_by(func.date_trunc('month', GitHubRepo.scraped_at)).order_by('date')
        
        results = query.all()
    else:
        results = []
    
    return {
        "metric": metric,
        "period_days": days,
        "group_by": group_by,
        "data": [
            {
                "date": str(r[0]),
                "count": r[1]
            }
            for r in results
        ]
    }


@router.get("/comparison", tags=["Statistics"])
async def compare_periods(
    period1_days: int = Query(7, ge=1, le=365, description="First period in days"),
    period2_days: int = Query(7, ge=1, le=365, description="Second period in days"),
    db: Session = Depends(get_db)
):
    """Compare two time periods."""
    now = datetime.utcnow()
    period1_end = now - timedelta(days=period2_days)
    period1_start = period1_end - timedelta(days=period1_days)
    period2_end = period1_end
    period2_start = period2_end - timedelta(days=period2_days)
    
    # Period 1 stats
    p1_articles = db.query(Article).filter(
        and_(
            Article.published_at >= period1_start,
            Article.published_at < period1_end
        )
    ).count()
    
    p1_repos = db.query(GitHubRepo).filter(
        and_(
            GitHubRepo.scraped_at >= period1_start,
            GitHubRepo.scraped_at < period1_end
        )
    ).count()
    
    # Period 2 stats
    p2_articles = db.query(Article).filter(
        and_(
            Article.published_at >= period2_start,
            Article.published_at < period2_end
        )
    ).count()
    
    p2_repos = db.query(GitHubRepo).filter(
        and_(
            GitHubRepo.scraped_at >= period2_start,
            GitHubRepo.scraped_at < period2_end
        )
    ).count()
    
    # Calculate changes
    article_change = ((p1_articles - p2_articles) / p2_articles * 100) if p2_articles > 0 else 0
    repo_change = ((p1_repos - p2_repos) / p2_repos * 100) if p2_repos > 0 else 0
    
    return {
        "period1": {
            "start": period1_start.isoformat(),
            "end": period1_end.isoformat(),
            "days": period1_days,
            "articles": p1_articles,
            "repos": p1_repos
        },
        "period2": {
            "start": period2_start.isoformat(),
            "end": period2_end.isoformat(),
            "days": period2_days,
            "articles": p2_articles,
            "repos": p2_repos
        },
        "changes": {
            "articles": {
                "absolute": p1_articles - p2_articles,
                "percentage": round(article_change, 2)
            },
            "repos": {
                "absolute": p1_repos - p2_repos,
                "percentage": round(repo_change, 2)
            }
        }
    }

