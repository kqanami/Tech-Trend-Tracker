"""Export endpoints for data export."""
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import datetime, timedelta
import csv
import json
import io

from app.db.database import get_db
from app.models.article import Article
from app.models.github_repo import GitHubRepo
from app.models.trend import Trend

router = APIRouter()


@router.get("/articles/csv", tags=["Export"])
async def export_articles_csv(
    source: Optional[str] = Query(None, description="Filter by source"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of articles"),
    db: Session = Depends(get_db)
):
    """Export articles to CSV."""
    query = db.query(Article)
    
    if source:
        query = query.filter(Article.source.ilike(f"%{source}%"))
    if category:
        query = query.filter(Article.category.ilike(f"%{category}%"))
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Article.published_at >= start)
        except:
            pass
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Article.published_at <= end)
        except:
            pass
    
    articles = query.order_by(desc(Article.published_at)).limit(limit).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'Title', 'URL', 'Source', 'Author', 'Category', 
        'Published At', 'Sentiment Score', 'Summary'
    ])
    
    # Write data
    for article in articles:
        writer.writerow([
            article.id,
            article.title,
            article.url,
            article.source,
            article.author or '',
            article.category or '',
            article.published_at.isoformat() if article.published_at else '',
            article.sentiment_score or 0,
            (article.summary or '')[:200]
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=articles_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )


@router.get("/articles/json", tags=["Export"])
async def export_articles_json(
    source: Optional[str] = Query(None, description="Filter by source"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of articles"),
    db: Session = Depends(get_db)
):
    """Export articles to JSON."""
    query = db.query(Article)
    
    if source:
        query = query.filter(Article.source.ilike(f"%{source}%"))
    if category:
        query = query.filter(Article.category.ilike(f"%{category}%"))
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Article.published_at >= start)
        except:
            pass
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Article.published_at <= end)
        except:
            pass
    
    articles = query.order_by(desc(Article.published_at)).limit(limit).all()
    
    data = {
        "export_date": datetime.utcnow().isoformat(),
        "total": len(articles),
        "articles": [article.to_dict() for article in articles]
    }
    
    return Response(
        content=json.dumps(data, indent=2, ensure_ascii=False),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=articles_{datetime.now().strftime('%Y%m%d')}.json"
        }
    )


@router.get("/trends/csv", tags=["Export"])
async def export_trends_csv(
    category: Optional[str] = Query(None, description="Filter by category"),
    min_score: Optional[float] = Query(None, description="Minimum score"),
    limit: int = Query(500, ge=1, le=5000, description="Maximum number of trends"),
    db: Session = Depends(get_db)
):
    """Export trends to CSV."""
    query = db.query(Trend)
    
    if category:
        query = query.filter(Trend.category.ilike(f"%{category}%"))
    if min_score is not None:
        query = query.filter(Trend.overall_score >= min_score)
    
    trends = query.order_by(desc(Trend.overall_score)).limit(limit).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'ID', 'Name', 'Category', 'Mention Count', 'Article Count', 'Repo Count',
        'Popularity Score', 'Growth Score', 'Overall Score', 'First Seen', 'Last Seen'
    ])
    
    for trend in trends:
        writer.writerow([
            trend.id,
            trend.name,
            trend.category,
            trend.mention_count,
            trend.article_count,
            trend.repo_count,
            trend.popularity_score,
            trend.growth_score,
            trend.overall_score,
            trend.first_seen_at.isoformat() if trend.first_seen_at else '',
            trend.last_seen_at.isoformat() if trend.last_seen_at else ''
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=trends_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )


@router.get("/repos/csv", tags=["Export"])
async def export_repos_csv(
    language: Optional[str] = Query(None, description="Filter by language"),
    min_stars: Optional[int] = Query(None, description="Minimum stars"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of repos"),
    db: Session = Depends(get_db)
):
    """Export repositories to CSV."""
    query = db.query(GitHubRepo)
    
    if language:
        query = query.filter(GitHubRepo.language.ilike(f"%{language}%"))
    if min_stars is not None:
        query = query.filter(GitHubRepo.stars >= min_stars)
    
    repos = query.order_by(desc(GitHubRepo.trending_score)).limit(limit).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        'ID', 'Name', 'Full Name', 'Language', 'Stars', 'Forks', 'Description',
        'URL', 'Trending Score', 'Created At'
    ])
    
    for repo in repos:
        writer.writerow([
            repo.id,
            repo.name,
            repo.full_name,
            repo.language or '',
            repo.stars,
            repo.forks,
            (repo.description or '')[:200],
            repo.url,
            repo.trending_score,
            repo.created_at.isoformat() if repo.created_at else ''
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=repos_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )


@router.get("/stats/summary", tags=["Export"])
async def export_stats_summary(
    days: int = Query(30, ge=1, le=365, description="Number of days"),
    db: Session = Depends(get_db)
):
    """Export summary statistics."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    total_articles = db.query(Article).count()
    articles_in_period = db.query(Article).filter(Article.published_at >= cutoff_date).count()
    
    total_repos = db.query(GitHubRepo).count()
    repos_in_period = db.query(GitHubRepo).filter(GitHubRepo.scraped_at >= cutoff_date).count()
    
    total_trends = db.query(Trend).count()
    
    # Top sources
    top_sources = db.query(
        Article.source,
        func.count(Article.id).label('count')
    ).filter(Article.published_at >= cutoff_date).group_by(
        Article.source
    ).order_by(desc('count')).limit(10).all()
    
    # Top categories
    top_categories = db.query(
        Article.category,
        func.count(Article.id).label('count')
    ).filter(
        Article.published_at >= cutoff_date,
        Article.category.isnot(None)
    ).group_by(Article.category).order_by(desc('count')).limit(10).all()
    
    # Top languages
    top_languages = db.query(
        GitHubRepo.language,
        func.count(GitHubRepo.id).label('count'),
        func.sum(GitHubRepo.stars).label('total_stars')
    ).filter(
        GitHubRepo.scraped_at >= cutoff_date,
        GitHubRepo.language.isnot(None)
    ).group_by(GitHubRepo.language).order_by(desc('count')).limit(10).all()
    
    data = {
        "period_days": days,
        "period_start": cutoff_date.isoformat(),
        "period_end": datetime.utcnow().isoformat(),
        "totals": {
            "articles": total_articles,
            "repos": total_repos,
            "trends": total_trends
        },
        "in_period": {
            "articles": articles_in_period,
            "repos": repos_in_period
        },
        "top_sources": [{"name": s[0], "count": s[1]} for s in top_sources],
        "top_categories": [{"name": c[0], "count": c[1]} for c in top_categories],
        "top_languages": [
            {"name": l[0], "count": l[1], "total_stars": l[2] or 0} 
            for l in top_languages
        ]
    }
    
    return Response(
        content=json.dumps(data, indent=2, ensure_ascii=False),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=stats_summary_{datetime.now().strftime('%Y%m%d')}.json"
        }
    )

