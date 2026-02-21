"""Advanced trend analysis and prediction service."""
import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import numpy as np

from app.models.trend import Trend
from app.models.trend_history import TrendHistory
from app.models.article import Article
from app.models.github_repo import GitHubRepo
from app.models.tag import Tag

logger = logging.getLogger(__name__)


class TrendAnalyzer:
    """Advanced trend analysis and prediction."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def save_trend_snapshot(self, trend: Trend) -> TrendHistory:
        """Save current state of a trend for historical tracking."""
        try:
            # Calculate average sentiment for related articles
            avg_sentiment = self._calculate_avg_sentiment(trend)
            
            # Count new mentions since last snapshot
            last_snapshot = self.db.query(TrendHistory).filter(
                TrendHistory.trend_id == trend.id
            ).order_by(desc(TrendHistory.recorded_at)).first()
            
            new_mentions = 0
            if last_snapshot:
                new_mentions = max(0, trend.mention_count - last_snapshot.mention_count)
            else:
                new_mentions = trend.mention_count
            
            snapshot = TrendHistory(
                trend_id=trend.id,
                mention_count=trend.mention_count,
                article_count=trend.article_count,
                repo_count=trend.repo_count,
                popularity_score=trend.popularity_score,
                growth_score=trend.growth_score,
                overall_score=trend.overall_score,
                avg_sentiment=avg_sentiment,
                new_mentions=new_mentions
            )
            
            self.db.add(snapshot)
            self.db.commit()
            self.db.refresh(snapshot)
            
            return snapshot
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving trend snapshot: {e}")
            raise
    
    def _calculate_avg_sentiment(self, trend: Trend) -> Optional[float]:
        """Calculate average sentiment of articles related to this trend."""
        try:
            # Find articles with tags matching trend name
            articles = self.db.query(Article).join(
                Article.tags
            ).filter(
                Tag.name.ilike(f"%{trend.name}%")
            ).filter(
                Article.sentiment_score.isnot(None)
            ).all()
            
            if not articles:
                return None
            
            sentiments = [a.sentiment_score for a in articles if a.sentiment_score is not None]
            return sum(sentiments) / len(sentiments) if sentiments else None
        except Exception as e:
            logger.error(f"Error calculating avg sentiment: {e}")
            return None
    
    def get_trend_history(self, trend_id: int, days: int = 30) -> List[Dict]:
        """Get historical data for a trend."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            history = self.db.query(TrendHistory).filter(
                TrendHistory.trend_id == trend_id,
                TrendHistory.recorded_at >= cutoff_date
            ).order_by(TrendHistory.recorded_at).all()
            
            return [h.to_dict() for h in history]
        except Exception as e:
            logger.error(f"Error getting trend history: {e}")
            return []
    
    def predict_trend_future(self, trend_id: int, days_ahead: int = 7) -> Dict:
        """Predict future trend score using simple linear regression."""
        try:
            history = self.get_trend_history(trend_id, days=30)
            
            if len(history) < 3:
                return {
                    "trend_id": trend_id,
                    "predicted_score": None,
                    "confidence": 0.0,
                    "message": "Not enough historical data"
                }
            
            # Extract scores and dates
            scores = [h["overall_score"] for h in history]
            dates = [datetime.fromisoformat(h["recorded_at"].replace('Z', '+00:00')) for h in history]
            
            # Simple linear regression
            x = np.array([(d - dates[0]).total_seconds() / 86400 for d in dates])
            y = np.array(scores)
            
            # Fit linear model
            coeffs = np.polyfit(x, y, 1)
            slope, intercept = coeffs
            
            # Predict future score
            last_date = dates[-1]
            future_date = last_date + timedelta(days=days_ahead)
            days_from_start = (future_date - dates[0]).total_seconds() / 86400
            predicted_score = slope * days_from_start + intercept
            
            # Calculate confidence based on R-squared
            y_pred = slope * x + intercept
            ss_res = np.sum((y - y_pred) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            confidence = max(0, min(1, r_squared))
            
            # Determine trend direction
            direction = "up" if slope > 0.1 else "down" if slope < -0.1 else "stable"
            
            return {
                "trend_id": trend_id,
                "predicted_score": round(max(0, min(100, predicted_score)), 2),
                "current_score": scores[-1],
                "confidence": round(confidence, 3),
                "direction": direction,
                "growth_rate": round(slope, 3),
                "days_ahead": days_ahead
            }
        except Exception as e:
            logger.error(f"Error predicting trend future: {e}")
            return {
                "trend_id": trend_id,
                "predicted_score": None,
                "confidence": 0.0,
                "message": f"Prediction error: {str(e)}"
            }
    
    def compare_trends(self, trend_ids: List[int]) -> Dict:
        """Compare multiple trends side by side."""
        try:
            trends = self.db.query(Trend).filter(Trend.id.in_(trend_ids)).all()
            
            if not trends:
                return {"error": "No trends found"}
            
            comparison = {
                "trends": [],
                "metrics": {
                    "highest_score": None,
                    "fastest_growing": None,
                    "most_mentioned": None
                }
            }
            
            max_score = 0
            max_growth = 0
            max_mentions = 0
            
            for trend in trends:
                trend_data = trend.to_dict()
                
                # Get recent history for growth calculation
                history = self.get_trend_history(trend.id, days=7)
                growth_rate = 0
                if len(history) >= 2:
                    old_score = history[0]["overall_score"]
                    new_score = history[-1]["overall_score"]
                    growth_rate = ((new_score - old_score) / old_score * 100) if old_score > 0 else 0
                
                trend_data["growth_rate"] = round(growth_rate, 2)
                comparison["trends"].append(trend_data)
                
                # Track metrics
                if trend.overall_score > max_score:
                    max_score = trend.overall_score
                    comparison["metrics"]["highest_score"] = trend.name
                
                if growth_rate > max_growth:
                    max_growth = growth_rate
                    comparison["metrics"]["fastest_growing"] = trend.name
                
                if trend.mention_count > max_mentions:
                    max_mentions = trend.mention_count
                    comparison["metrics"]["most_mentioned"] = trend.name
            
            return comparison
        except Exception as e:
            logger.error(f"Error comparing trends: {e}")
            return {"error": str(e)}
    
    def find_related_trends(self, trend_id: int, limit: int = 5) -> List[Dict]:
        """Find trends that are often mentioned together."""
        try:
            trend = self.db.query(Trend).filter(Trend.id == trend_id).first()
            if not trend:
                return []
            
            # Find articles that mention this trend
            articles = self.db.query(Article).join(
                Article.tags
            ).filter(
                Tag.name.ilike(f"%{trend.name}%")
            ).all()
            
            # Count co-occurring tags
            co_occurrence = {}
            for article in articles:
                for tag in article.tags:
                    if tag.name.lower() != trend.name.lower():
                        co_occurrence[tag.name] = co_occurrence.get(tag.name, 0) + 1
            
            # Find trends matching these tags
            related_trends = []
            for tag_name, count in sorted(co_occurrence.items(), key=lambda x: x[1], reverse=True)[:limit * 2]:
                related_trend = self.db.query(Trend).filter(
                    Trend.name.ilike(f"%{tag_name}%")
                ).first()
                
                if related_trend and related_trend.id != trend_id:
                    trend_dict = related_trend.to_dict()
                    trend_dict["co_occurrence_count"] = count
                    related_trends.append(trend_dict)
                    
                    if len(related_trends) >= limit:
                        break
            
            return related_trends
        except Exception as e:
            logger.error(f"Error finding related trends: {e}")
            return []
    
    def get_trend_insights(self, trend_id: int) -> Dict:
        """Get comprehensive insights about a trend."""
        try:
            trend = self.db.query(Trend).filter(Trend.id == trend_id).first()
            if not trend:
                return {"error": "Trend not found"}
            
            history = self.get_trend_history(trend_id, days=30)
            prediction = self.predict_trend_future(trend_id, days_ahead=7)
            related = self.find_related_trends(trend_id, limit=3)
            
            # Calculate momentum (rate of change)
            momentum = 0
            if len(history) >= 2:
                recent = history[-7:] if len(history) >= 7 else history
                if len(recent) >= 2:
                    momentum = ((recent[-1]["overall_score"] - recent[0]["overall_score"]) / 
                               len(recent)) if len(recent) > 0 else 0
            
            # Get top articles
            articles = self.db.query(Article).join(
                Article.tags
            ).filter(
                Tag.name.ilike(f"%{trend.name}%")
            ).order_by(desc(Article.published_at)).limit(5).all()
            
            # Get top repos
            repos = self.db.query(GitHubRepo).filter(
                GitHubRepo.language.ilike(f"%{trend.name}%")
            ).order_by(desc(GitHubRepo.trending_score)).limit(5).all()
            
            return {
                "trend": trend.to_dict(),
                "history_points": len(history),
                "momentum": round(momentum, 3),
                "prediction": prediction,
                "related_trends": related,
                "top_articles": [a.to_dict() for a in articles],
                "top_repos": [r.to_dict() for r in repos],
                "avg_sentiment": history[-1]["avg_sentiment"] if history else None
            }
        except Exception as e:
            logger.error(f"Error getting trend insights: {e}")
            return {"error": str(e)}

