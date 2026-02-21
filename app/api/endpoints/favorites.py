"""Favorites/bookmarks endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.db.database import get_db
from app.models.article import Article
from app.models.trend import Trend
from app.models.github_repo import GitHubRepo

router = APIRouter()


class FavoriteRequest(BaseModel):
    item_type: str  # 'article', 'trend', 'repo'
    item_id: int


@router.post("/favorites", tags=["Favorites"])
async def add_favorite(
    request: FavoriteRequest,
    db: Session = Depends(get_db)
):
    """Add item to favorites (stored in browser localStorage on frontend)."""
    # This is a placeholder - actual favorites would be stored in DB with user auth
    # For now, we just validate the item exists
    if request.item_type == 'article':
        item = db.query(Article).filter(Article.id == request.item_id).first()
    elif request.item_type == 'trend':
        item = db.query(Trend).filter(Trend.id == request.item_id).first()
    elif request.item_type == 'repo':
        item = db.query(GitHubRepo).filter(GitHubRepo.id == request.item_id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid item_type")
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {
        "success": True,
        "message": f"{request.item_type} added to favorites",
        "item_id": request.item_id
    }


@router.get("/favorites/validate", tags=["Favorites"])
async def validate_favorites(
    item_ids: str = None,  # Comma-separated IDs
    item_type: str = "article",
    db: Session = Depends(get_db)
):
    """Validate favorite items exist."""
    if not item_ids:
        return {"valid_ids": [], "invalid_ids": []}
    
    ids = [int(id.strip()) for id in item_ids.split(',') if id.strip().isdigit()]
    
    if item_type == 'article':
        valid = db.query(Article.id).filter(Article.id.in_(ids)).all()
    elif item_type == 'trend':
        valid = db.query(Trend.id).filter(Trend.id.in_(ids)).all()
    elif item_type == 'repo':
        valid = db.query(GitHubRepo.id).filter(GitHubRepo.id.in_(ids)).all()
    else:
        return {"valid_ids": [], "invalid_ids": ids}
    
    valid_ids = [v[0] for v in valid]
    invalid_ids = [id for id in ids if id not in valid_ids]
    
    return {
        "valid_ids": valid_ids,
        "invalid_ids": invalid_ids
    }

