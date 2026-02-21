
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.models.article import Article
from app.models.trend import Trend
from app.models.tag import Tag

from app.api.schemas import GraphDataResponse

router = APIRouter()

@router.get("/data", response_model=GraphDataResponse)
def get_graph_data(
    min_weight: int = Query(1, ge=1, description="Minimum connection weight"),
    limit: int = Query(500, ge=1, le=1000, description="Maximum number of nodes"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """
    Get nodes and links for the knowledge graph.
    Nodes are tags/technologies.
    Links represent co-occurrence in articles.
    """
    # 1. Fetch articles with their tags
    query = db.query(Article)
    
    if category:
        query = query.filter(Article.category.ilike(f"%{category}%"))
    
    articles = query.all()
    
    nodes = {}
    links = []
    
    # helper to track connection strength
    connections = {} 
    
    for article in articles:
        if not article.tags:
            continue
            
        article_tags = [t.name for t in article.tags]
        
        # Build nodes
        for tag_name in article_tags:
            if tag_name not in nodes:
                nodes[tag_name] = {
                    "id": tag_name, 
                    "val": 0, 
                    "group": "technology",
                    "category": article.category or "general"
                }
            nodes[tag_name]["val"] += 1
            
        # Build links (co-occurrence)
        for i in range(len(article_tags)):
            for j in range(i + 1, len(article_tags)):
                source = article_tags[i]
                target = article_tags[j]
                
                # Sort to ensure consistent key
                key = tuple(sorted([source, target]))
                
                if key not in connections:
                    connections[key] = 0
                connections[key] += 1
    
    # Format links
    for (source, target), weight in connections.items():
        if weight >= min_weight:
            links.append({
                "source": source,
                "target": target,
                "value": weight
            })
            
    # Format nodes list
    nodes_list = list(nodes.values())
    
    # Sort nodes by value (importance) and limit
    nodes_list.sort(key=lambda x: x["val"], reverse=True)
    if limit:
        nodes_list = nodes_list[:limit]
        
    return {
        "nodes": nodes_list,
        "links": links,
        "total_nodes": len(nodes),
        "total_links": len(links)
    }


@router.get("/connections/{trend_name}", response_model=Dict)
def get_trend_connections(
    trend_name: str,
    limit: int = Query(10, ge=1, le=50, description="Number of connections"),
    db: Session = Depends(get_db)
):
    """
    Get technologies that are most often mentioned together with a given trend.
    """
    # Find articles mentioning this trend
    articles = db.query(Article).join(
        Article.tags
    ).filter(
        Tag.name.ilike(f"%{trend_name}%")
    ).all()
    
    if not articles:
        raise HTTPException(status_code=404, detail=f"No articles found for trend: {trend_name}")
    
    # Count co-occurring technologies
    co_occurrence = {}
    for article in articles:
        for tag in article.tags:
            tag_name = tag.name.lower()
            if trend_name.lower() not in tag_name:
                co_occurrence[tag_name] = co_occurrence.get(tag_name, 0) + 1
    
    # Get trend info
    trend = db.query(Trend).filter(Trend.name.ilike(f"%{trend_name}%")).first()
    
    # Format results
    connections = sorted(
        [{"name": name, "count": count, "strength": min(100, count * 10)} 
         for name, count in co_occurrence.items()],
        key=lambda x: x["count"],
        reverse=True
    )[:limit]
    
    return {
        "trend": trend_name,
        "trend_info": trend.to_dict() if trend else None,
        "total_articles": len(articles),
        "connections": connections,
        "strongest_connection": connections[0] if connections else None
    }


@router.get("/cluster-analysis", response_model=Dict)
def get_cluster_analysis(
    min_connections: int = Query(3, ge=1, description="Minimum connections for cluster"),
    db: Session = Depends(get_db)
):
    """
    Analyze technology clusters - groups of technologies that often appear together.
    """
    # Get all articles with tags
    articles = db.query(Article).join(Article.tags).all()
    
    # Build connection graph
    connections = {}
    for article in articles:
        tags = [t.name for t in article.tags]
        for i in range(len(tags)):
            for j in range(i + 1, len(tags)):
                key = tuple(sorted([tags[i], tags[j]]))
                connections[key] = connections.get(key, 0) + 1
    
    # Find clusters using simple algorithm
    # A cluster is a set of technologies where each has at least min_connections
    # connections to others in the cluster
    
    clusters = []
    processed = set()
    
    # Get all unique technologies
    all_techs = set()
    for (tech1, tech2) in connections.keys():
        all_techs.add(tech1)
        all_techs.add(tech2)
    
    for tech in all_techs:
        if tech in processed:
            continue
        
        # Find technologies connected to this one
        cluster_techs = {tech}
        for (t1, t2), count in connections.items():
            if count >= min_connections:
                if tech in (t1, t2):
                    cluster_techs.add(t1 if t1 != tech else t2)
        
        # Check if cluster is valid (each tech has enough connections)
        if len(cluster_techs) >= 3:
            valid_cluster = True
            for cluster_tech in cluster_techs:
                connections_count = sum(
                    1 for (t1, t2), count in connections.items()
                    if cluster_tech in (t1, t2) and 
                    (t1 in cluster_techs and t2 in cluster_techs) and
                    count >= min_connections
                )
                if connections_count < min_connections:
                    valid_cluster = False
                    break
            
            if valid_cluster:
                clusters.append({
                    "technologies": list(cluster_techs),
                    "size": len(cluster_techs),
                    "avg_connections": sum(
                        count for (t1, t2), count in connections.items()
                        if t1 in cluster_techs and t2 in cluster_techs
                    ) / max(1, len(cluster_techs) * (len(cluster_techs) - 1) / 2)
                })
                processed.update(cluster_techs)
    
    # Sort clusters by size
    clusters.sort(key=lambda x: x["size"], reverse=True)
    
    return {
        "clusters": clusters[:10],  # Top 10 clusters
        "total_clusters": len(clusters),
        "min_connections": min_connections
    }
