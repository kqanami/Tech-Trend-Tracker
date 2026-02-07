"""GitHub repository model for trending repos."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, BigInteger, Float, Index
from sqlalchemy.sql import func
from app.db.database import Base


class GitHubRepo(Base):
    """Model for GitHub trending repositories."""
    
    __tablename__ = "github_repos"
    
    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(BigInteger, unique=True, nullable=True)
    name = Column(String(200), nullable=False, index=True)
    full_name = Column(String(300), unique=True, nullable=False, index=True)
    owner = Column(String(100), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String(50), nullable=True, index=True)
    topics = Column(String(1000), nullable=True)  # JSON-like storage
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    open_issues = Column(Integer, default=0)
    watchers = Column(Integer, default=0)
    stars_today = Column(Integer, default=0)
    stars_week = Column(Integer, default=0)
    stars_month = Column(Integer, default=0)
    trending_score = Column(Float, default=0.0, index=True)
    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    pushed_at = Column(DateTime(timezone=True), nullable=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    license = Column(String(100), nullable=True)
    is_fork = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    is_processed = Column(Boolean, default=False)
    category = Column(String(100), nullable=True, index=True)
    
    __table_args__ = (
        Index('idx_repo_language_stars', 'language', 'stars'),
        Index('idx_repo_trending', 'trending_score', 'scraped_at'),
    )
    
    def __repr__(self):
        return f"<GitHubRepo(id={self.id}, full_name='{self.full_name}')>"
    
    def to_dict(self):
        import json
        topics = []
        if self.topics:
            try:
                topics = json.loads(self.topics)
            except:
                topics = self.topics.split(',') if ',' in self.topics else []
        
        return {
            "id": self.id,
            "repo_id": self.repo_id,
            "name": self.name,
            "full_name": self.full_name,
            "owner": self.owner,
            "url": self.url,
            "description": self.description,
            "language": self.language,
            "topics": topics,
            "stars": self.stars,
            "forks": self.forks,
            "open_issues": self.open_issues,
            "watchers": self.watchers,
            "stars_today": self.stars_today,
            "stars_week": self.stars_week,
            "stars_month": self.stars_month,
            "trending_score": self.trending_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "pushed_at": self.pushed_at.isoformat() if self.pushed_at else None,
            "scraped_at": self.scraped_at.isoformat() if self.scraped_at else None,
            "license": self.license,
            "is_fork": self.is_fork,
            "category": self.category
        }
