"""Tag model for categorizing content."""
from sqlalchemy import Column, Integer, String, DateTime, func, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

# Association table for many-to-many relationship between articles and tags
article_tags = Table(
    'article_tags',
    Base.metadata,
    Column('article_id', Integer, ForeignKey('articles.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)


class Tag(Base):
    """Model for tags/keywords."""
    
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(50), nullable=True, index=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    articles = relationship("Article", secondary=article_tags, back_populates="tags")
    
    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "category": self.category,
            "usage_count": self.usage_count
        }
