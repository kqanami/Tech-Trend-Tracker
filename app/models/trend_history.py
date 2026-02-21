"""TrendHistory model for tracking trend metrics over time (snapshots)."""
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class TrendHistory(Base):
    """Snapshot of a trend's metrics at a given point in time."""

    __tablename__ = "trend_history"

    id = Column(Integer, primary_key=True, index=True)
    trend_id = Column(Integer, ForeignKey("trends.id"), nullable=False, index=True)
    recorded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Metric snapshot
    mention_count = Column(Integer, default=0)
    article_count = Column(Integer, default=0)
    repo_count = Column(Integer, default=0)
    popularity_score = Column(Float, default=0.0)
    growth_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    avg_sentiment = Column(Float, nullable=True)
    new_mentions = Column(Integer, default=0)

    # Relationships
    trend = relationship("Trend", back_populates="history")

    __table_args__ = (
        Index("idx_trend_history_trend_date", "trend_id", "recorded_at"),
    )

    def __repr__(self):
        return f"<TrendHistory(id={self.id}, trend_id={self.trend_id}, recorded_at={self.recorded_at})>"

    def to_dict(self):
        return {
            "id": self.id,
            "trend_id": self.trend_id,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
            "mention_count": self.mention_count,
            "article_count": self.article_count,
            "repo_count": self.repo_count,
            "popularity_score": self.popularity_score,
            "growth_score": self.growth_score,
            "overall_score": self.overall_score,
            "avg_sentiment": self.avg_sentiment,
            "new_mentions": self.new_mentions,
        }
