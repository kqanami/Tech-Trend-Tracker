"""Analytics endpoints for trend analysis."""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.trend import Trend
from app.services.trend_analyzer import TrendAnalyzer
from app.services.ml_analyzer import MLAnalyzer

router = APIRouter()


@router.get("/trends/{trend_id}/history", tags=["Analytics"])
async def get_trend_history(
    trend_id: int = Path(..., description="Trend ID"),
    days: int = Query(30, ge=1, le=365, description="Number of days of history"),
    db: Session = Depends(get_db)
):
    """Get historical data for a trend."""
    analyzer = TrendAnalyzer(db)
    history = analyzer.get_trend_history(trend_id, days=days)
    
    if not history:
        raise HTTPException(status_code=404, detail="Trend history not found")
    
    return {
        "trend_id": trend_id,
        "days": days,
        "data_points": len(history),
        "history": history
    }


@router.get("/trends/{trend_id}/predict", tags=["Analytics"])
async def predict_trend(
    trend_id: int = Path(..., description="Trend ID"),
    days_ahead: int = Query(7, ge=1, le=30, description="Days to predict ahead"),
    db: Session = Depends(get_db)
):
    """Predict future trend score."""
    analyzer = TrendAnalyzer(db)
    prediction = analyzer.predict_trend_future(trend_id, days_ahead=days_ahead)
    
    if prediction.get("predicted_score") is None:
        raise HTTPException(status_code=400, detail=prediction.get("message", "Prediction failed"))
    
    return prediction


@router.get("/trends/{trend_id}/insights", tags=["Analytics"])
async def get_trend_insights(
    trend_id: int = Path(..., description="Trend ID"),
    db: Session = Depends(get_db)
):
    """Get comprehensive insights about a trend."""
    analyzer = TrendAnalyzer(db)
    insights = analyzer.get_trend_insights(trend_id)
    
    if "error" in insights:
        raise HTTPException(status_code=404, detail=insights["error"])
    
    return insights


@router.get("/trends/{trend_id}/related", tags=["Analytics"])
async def get_related_trends(
    trend_id: int = Path(..., description="Trend ID"),
    limit: int = Query(5, ge=1, le=20, description="Number of related trends"),
    db: Session = Depends(get_db)
):
    """Find trends that are often mentioned together."""
    analyzer = TrendAnalyzer(db)
    related = analyzer.find_related_trends(trend_id, limit=limit)
    return {
        "trend_id": trend_id,
        "related_trends": related
    }


@router.post("/trends/compare", tags=["Analytics"])
async def compare_trends(
    trend_ids: List[int],
    db: Session = Depends(get_db)
):
    """Compare multiple trends side by side."""
    if len(trend_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 trend IDs required")
    
    if len(trend_ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 trends can be compared")
    
    analyzer = TrendAnalyzer(db)
    comparison = analyzer.compare_trends(trend_ids)
    
    if "error" in comparison:
        raise HTTPException(status_code=400, detail=comparison["error"])
    
    return comparison


@router.get("/trends/emerging", tags=["Analytics"])
async def get_emerging_trends(
    days: int = Query(7, ge=1, le=30, description="Time window in days"),
    min_growth: float = Query(10.0, ge=0, description="Minimum growth rate"),
    limit: int = Query(10, ge=1, le=50, description="Number of trends"),
    db: Session = Depends(get_db)
):
    """Get emerging trends (fastest growing)."""
    from app.models.trend_history import TrendHistory
    from sqlalchemy import func
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get trends with recent history
    trends_with_history = db.query(
        Trend.id,
        Trend.name,
        Trend.category,
        Trend.overall_score,
        func.max(TrendHistory.overall_score).label('recent_score'),
        func.min(TrendHistory.overall_score).label('old_score')
    ).join(
        TrendHistory, Trend.id == TrendHistory.trend_id
    ).filter(
        TrendHistory.recorded_at >= cutoff_date
    ).group_by(
        Trend.id, Trend.name, Trend.category, Trend.overall_score
    ).having(
        func.max(TrendHistory.overall_score) > func.min(TrendHistory.overall_score)
    ).all()
    
    emerging = []
    for trend_id, name, category, current_score, recent_score, old_score in trends_with_history:
        if old_score > 0:
            growth_rate = ((recent_score - old_score) / old_score) * 100
            if growth_rate >= min_growth:
                emerging.append({
                    "trend_id": trend_id,
                    "name": name,
                    "category": category,
                    "current_score": current_score,
                    "growth_rate": round(growth_rate, 2),
                    "score_change": round(recent_score - old_score, 2)
                })
    
    # Sort by growth rate
    emerging.sort(key=lambda x: x["growth_rate"], reverse=True)
    
    return {
        "days": days,
        "min_growth": min_growth,
        "trends": emerging[:limit]
    }


@router.get("/recommendations", tags=["Analytics"])
async def get_recommendations(
    interests: Optional[str] = Query(None, description="Comma-separated list of interests"),
    limit: int = Query(10, ge=1, le=20, description="Number of recommendations"),
    db: Session = Depends(get_db)
):
    """Get personalized trend recommendations based on interests."""
    from app.models.article import Article
    from app.models.tag import Tag
    from sqlalchemy import func, desc
    
    if not interests:
        # Return top trends if no interests specified
        top_trends = db.query(Trend).order_by(desc(Trend.overall_score)).limit(limit).all()
        return {
            "type": "popular",
            "recommendations": [t.to_dict() for t in top_trends]
        }
    
    # Parse interests
    interest_list = [i.strip().lower() for i in interests.split(",")]
    
    # Find trends matching interests
    matching_trends = []
    
    for interest in interest_list:
        trends = db.query(Trend).filter(
            (Trend.name.ilike(f"%{interest}%")) |
            (Trend.category.ilike(f"%{interest}%")) |
            (Trend.description.ilike(f"%{interest}%"))
        ).all()
        
        for trend in trends:
            if trend.id not in [t["id"] for t in matching_trends]:
                trend_dict = trend.to_dict()
                trend_dict["match_reason"] = f"Matches interest: {interest}"
                trend_dict["relevance_score"] = 1.0
                matching_trends.append(trend_dict)
    
    # Also find related trends
    analyzer = TrendAnalyzer(db)
    for trend_dict in matching_trends[:5]:  # Limit to avoid too many queries
        related = analyzer.find_related_trends(trend_dict["id"], limit=3)
        for rel in related:
            if rel["id"] not in [t["id"] for t in matching_trends]:
                rel["match_reason"] = f"Related to {trend_dict['name']}"
                rel["relevance_score"] = 0.7
                matching_trends.append(rel)
    
    # Sort by relevance and overall score
    matching_trends.sort(key=lambda x: (x["relevance_score"], x["overall_score"]), reverse=True)
    
    return {
        "type": "personalized",
        "interests": interest_list,
        "recommendations": matching_trends[:limit]
    }

