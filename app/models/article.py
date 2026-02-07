"""Article model for TechCrunch and other tech news."""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Article(Base):
    """Model for tech news articles."""
    
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    url = Column(String(1000), unique=True, nullable=False, index=True)
    source = Column(String(100), nullable=False, index=True)
    author = Column(String(200), nullable=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    image_url = Column(String(1000), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    language = Column(String(10), default="en")
    is_processed = Column(Boolean, default=False)
    sentiment_score = Column(Float, nullable=True)
    
    # Relationships
    tags = relationship("Tag", secondary="article_tags", back_populates="articles")
    
    __table_args__ = (
        Index('idx_article_source_published', 'source', 'published_at'),
        Index('idx_article_category_published', 'category', 'published_at'),
    )
    
    def __repr__(self):
        return f"<Article(id={self.id}, title='{self.title[:50]}...')>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "source": self.source,
            "author": self.author,
            "summary": self.summary,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "scraped_at": self.scraped_at.isoformat() if self.scraped_at else None,
            "category": self.category,
            "image_url": self.image_url,
            "sentiment_score": self.sentiment_score,
            "tags": [tag.name for tag in self.tags] if self.tags else []
        }
