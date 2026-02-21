
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import text, or_, func
from typing import List, Optional, Dict
from app.db.database import get_db
from app.models.article import Article
from app.models.tag import Tag
from app.services.ml_analyzer import MLAnalyzer
from app.core.config import settings

router = APIRouter()
ml_analyzer = MLAnalyzer()

@router.get("/vector", response_model=List[dict])
async def search_articles(
    q: str = Query(..., min_length=3, description="Search query"),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Semantic search for articles using vector embeddings.
    """
    if not settings.GEMINI_API_KEY:
         raise HTTPException(status_code=501, detail="Semantic search not available (AI key missing)")

    # 1. Generate embedding for the query
    query_embedding = ml_analyzer.generate_embedding(q)
    
    if not query_embedding:
        raise HTTPException(status_code=500, detail="Failed to generate search embedding")

    # 2. Perform vector search using pgvector l2_distance or cosine distance
    # <=> is cosine distance operator in pgvector
    
    # We use raw SQL for best performance/compatibility with pgvector + sqlalchemy
    try:
        results = db.query(Article).order_by(
            Article.embedding.cosine_distance(query_embedding)
        ).limit(limit).all()
        
        return [
            {
                "id": a.id,
                "title": a.title,
                "summary": a.summary,
                "url": a.url,
                "source": a.source,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "category": a.category,
                "technical_analysis": a.technical_analysis,
                "sentiment_score": a.sentiment_score
            }
            for a in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/hybrid", response_model=Dict)
async def hybrid_search(
    q: str = Query(..., min_length=3, description="Search query"),
    limit: int = 10,
    vector_weight: float = Query(0.7, ge=0, le=1, description="Weight for vector search (0-1)"),
    keyword_weight: float = Query(0.3, ge=0, le=1, description="Weight for keyword search (0-1)"),
    db: Session = Depends(get_db)
):
    """
    Hybrid search combining vector semantic search with keyword matching.
    Returns best results from both approaches.
    """
    if vector_weight + keyword_weight != 1.0:
        raise HTTPException(status_code=400, detail="vector_weight + keyword_weight must equal 1.0")
    
    results = {
        "query": q,
        "vector_results": [],
        "keyword_results": [],
        "combined_results": []
    }
    
    # 1. Vector search (if available)
    if settings.GEMINI_API_KEY:
        try:
            query_embedding = ml_analyzer.generate_embedding(q)
            if query_embedding:
                vector_articles = db.query(Article).order_by(
                    Article.embedding.cosine_distance(query_embedding)
                ).limit(int(limit * vector_weight * 2)).all()
                
                results["vector_results"] = [
                    {
                        "id": a.id,
                        "title": a.title,
                        "summary": a.summary,
                        "url": a.url,
                        "source": a.source,
                        "published_at": a.published_at.isoformat() if a.published_at else None,
                        "category": a.category,
                        "score": 1.0 - (i / len(vector_articles)) if vector_articles else 0,  # Normalized score
                        "type": "semantic"
                    }
                    for i, a in enumerate(vector_articles)
                ]
        except Exception as e:
            pass  # Fallback to keyword only
    
    # 2. Keyword search
    search_filter = f"%{q}%"
    keyword_articles = db.query(Article).filter(
        or_(
            Article.title.ilike(search_filter),
            Article.summary.ilike(search_filter),
            Article.content.ilike(search_filter)
        )
    ).limit(int(limit * keyword_weight * 2)).all()
    
    # Also search in tags
    tag_articles = db.query(Article).join(Article.tags).filter(
        Tag.name.ilike(search_filter)
    ).distinct().limit(int(limit * keyword_weight)).all()
    
    # Combine and deduplicate
    keyword_set = {a.id: a for a in keyword_articles}
    for a in tag_articles:
        if a.id not in keyword_set:
            keyword_set[a.id] = a
    
    results["keyword_results"] = [
        {
            "id": a.id,
            "title": a.title,
            "summary": a.summary,
            "url": a.url,
            "source": a.source,
            "published_at": a.published_at.isoformat() if a.published_at else None,
            "category": a.category,
            "score": 0.8 - (i / len(keyword_set)) * 0.3 if keyword_set else 0,  # Normalized score
            "type": "keyword"
        }
        for i, a in enumerate(keyword_set.values())
    ]
    
    # 3. Combine results with weighted scores
    combined = {}
    
    # Add vector results
    for item in results["vector_results"]:
        article_id = item["id"]
        if article_id not in combined:
            combined[article_id] = item.copy()
            combined[article_id]["combined_score"] = item["score"] * vector_weight
        else:
            combined[article_id]["combined_score"] += item["score"] * vector_weight
    
    # Add keyword results
    for item in results["keyword_results"]:
        article_id = item["id"]
        if article_id not in combined:
            combined[article_id] = item.copy()
            combined[article_id]["combined_score"] = item["score"] * keyword_weight
        else:
            combined[article_id]["combined_score"] += item["score"] * keyword_weight
            combined[article_id]["type"] = "hybrid"  # Found in both
    
    # Sort by combined score and limit
    results["combined_results"] = sorted(
        list(combined.values()),
        key=lambda x: x["combined_score"],
        reverse=True
    )[:limit]
    
    return results


@router.get("/similar/{article_id}", response_model=List[dict])
async def find_similar_articles(
    article_id: int = Path(..., description="Article ID"),
    limit: int = Query(5, ge=1, le=20, description="Number of similar articles"),
    db: Session = Depends(get_db)
):
    """Find articles similar to the given article using vector embeddings."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=501, detail="Similarity search not available (AI key missing)")
    
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if not article.embedding:
        raise HTTPException(status_code=400, detail="Article has no embedding")
    
    try:
        # Find similar articles using cosine distance
        similar = db.query(Article).filter(
            Article.id != article_id
        ).order_by(
            Article.embedding.cosine_distance(article.embedding)
        ).limit(limit).all()
        
        return [
            {
                "id": a.id,
                "title": a.title,
                "summary": a.summary,
                "url": a.url,
                "source": a.source,
                "published_at": a.published_at.isoformat() if a.published_at else None,
                "category": a.category,
                "similarity_score": 1.0 - (i / len(similar)) if similar else 0
            }
            for i, a in enumerate(similar)
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity search failed: {str(e)}")
