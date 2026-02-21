"""Trend model for tracking technology trends over time."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Trend(Base):
    """Model for tracking technology trends and their metrics."""
    
    __tablename__ = "trends"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True)

    # Relationships
    history = relationship("TrendHistory", back_populates="trend", cascade="all, delete-orphan")

    mention_count = Column(Integer, default=0)
    article_count = Column(Integer, default=0)
    repo_count = Column(Integer, default=0)
    popularity_score = Column(Float, default=0.0)
    growth_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0, index=True)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    calculated_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        Index('idx_trend_category_score', 'category', 'overall_score'),
    )
    
    def __repr__(self):
        return f"<Trend(id={self.id}, name='{self.name}', score={self.overall_score})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "category": self.category,
            "subcategory": self.subcategory,
            "mention_count": self.mention_count,
            "article_count": self.article_count,
            "repo_count": self.repo_count,
            "popularity_score": self.popularity_score,
            "growth_score": self.growth_score,
            "overall_score": self.overall_score,
            "first_seen_at": self.first_seen_at.isoformat() if self.first_seen_at else None,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
        }
