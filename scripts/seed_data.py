#!/usr/bin/env python3
"""Seed database with sample data."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from app.db.database import SessionLocal
from app.models.article import Article
from app.models.github_repo import GitHubRepo
from app.models.trend import Trend
from app.models.tag import Tag


def seed_articles(db):
    """Seed sample articles."""
    sample_articles = [
        {
            "title": "OpenAI Announces GPT-5 with Revolutionary Capabilities",
            "url": "https://techcrunch.com/2024/01/15/openai-gpt-5-announcement",
            "source": "techcrunch",
            "author": "Jane Smith",
            "summary": "OpenAI has unveiled GPT-5, featuring unprecedented reasoning capabilities and multimodal understanding.",
            "category": "artificial-intelligence",
            "published_at": datetime.now() - timedelta(days=1),
        },
        {
            "title": "Rust Programming Language Surpasses C++ in Developer Survey",
            "url": "https://techcrunch.com/2024/01/14/rust-surpasses-cpp",
            "source": "techcrunch",
            "author": "John Doe",
            "summary": "The annual developer survey shows Rust has overtaken C++ as the most loved systems programming language.",
            "category": "programming",
            "published_at": datetime.now() - timedelta(days=2),
        },
        {
            "title": "Kubernetes 2.0 Released with Native AI Workload Support",
            "url": "https://techcrunch.com/2024/01/13/kubernetes-2-release",
            "source": "techcrunch",
            "author": "Alice Johnson",
            "summary": "The new version of Kubernetes introduces built-in support for AI/ML workloads and improved auto-scaling.",
            "category": "devops",
            "published_at": datetime.now() - timedelta(days=3),
        },
        {
            "title": "Stripe Raises $6.5B in Latest Funding Round",
            "url": "https://techcrunch.com/2024/01/12/stripe-funding",
            "source": "techcrunch",
            "author": "Bob Wilson",
            "summary": "Fintech giant Stripe has secured $6.5 billion in funding, valuing the company at $65 billion.",
            "category": "startups",
            "published_at": datetime.now() - timedelta(days=4),
        },
        {
            "title": "New WebAssembly Standard Enables Browser-Based Machine Learning",
            "url": "https://techcrunch.com/2024/01/11/webassembly-ml",
            "source": "techcrunch",
            "author": "Carol Davis",
            "summary": "The latest WebAssembly specification adds support for SIMD operations, enabling high-performance ML in browsers.",
            "category": "web",
            "published_at": datetime.now() - timedelta(days=5),
        },
    ]
    
    for data in sample_articles:
        existing = db.query(Article).filter(Article.url == data["url"]).first()
        if not existing:
            article = Article(**data, is_processed=True)
            db.add(article)
    
    db.commit()
    print(f"Seeded {len(sample_articles)} articles")


def seed_repos(db):
    """Seed sample GitHub repositories."""
    import json
    
    sample_repos = [
        {
            "name": "transformers",
            "full_name": "huggingface/transformers",
            "owner": "huggingface",
            "url": "https://github.com/huggingface/transformers",
            "description": "State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.",
            "language": "Python",
            "topics": json.dumps(["machine-learning", "deep-learning", "nlp", "pytorch"]),
            "stars": 120000,
            "forks": 24000,
            "open_issues": 1500,
            "watchers": 120000,
            "stars_today": 150,
            "stars_week": 1200,
            "stars_month": 5000,
            "trending_score": 95.5,
            "category": "AI/ML",
            "license": "Apache-2.0",
        },
        {
            "name": "react",
            "full_name": "facebook/react",
            "owner": "facebook",
            "url": "https://github.com/facebook/react",
            "description": "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
            "language": "JavaScript",
            "topics": json.dumps(["javascript", "frontend", "ui", "web"]),
            "stars": 220000,
            "forks": 45000,
            "open_issues": 800,
            "watchers": 220000,
            "stars_today": 80,
            "stars_week": 600,
            "stars_month": 2500,
            "trending_score": 88.0,
            "category": "Web Development",
            "license": "MIT",
        },
        {
            "name": "kubernetes",
            "full_name": "kubernetes/kubernetes",
            "owner": "kubernetes",
            "url": "https://github.com/kubernetes/kubernetes",
            "description": "Production-Grade Container Scheduling and Management",
            "language": "Go",
            "topics": json.dumps(["docker", "containers", "orchestration", "cloud"]),
            "stars": 105000,
            "forks": 38000,
            "open_issues": 2500,
            "watchers": 105000,
            "stars_today": 45,
            "stars_week": 350,
            "stars_month": 1500,
            "trending_score": 82.5,
            "category": "DevOps",
            "license": "Apache-2.0",
        },
        {
            "name": "rust",
            "full_name": "rust-lang/rust",
            "owner": "rust-lang",
            "url": "https://github.com/rust-lang/rust",
            "description": "Empowering everyone to build reliable and efficient software.",
            "language": "Rust",
            "topics": json.dumps(["compiler", "systems-programming", "language"]),
            "stars": 90000,
            "forks": 12000,
            "open_issues": 9000,
            "watchers": 90000,
            "stars_today": 120,
            "stars_week": 900,
            "stars_month": 4000,
            "trending_score": 91.0,
            "category": "Programming Language",
            "license": "MIT",
        },
        {
            "name": "next.js",
            "full_name": "vercel/next.js",
            "owner": "vercel",
            "url": "https://github.com/vercel/next.js",
            "description": "The React Framework for the Web",
            "language": "TypeScript",
            "topics": json.dumps(["react", "framework", "ssr", "web"]),
            "stars": 118000,
            "forks": 25000,
            "open_issues": 2200,
            "watchers": 118000,
            "stars_today": 95,
            "stars_week": 750,
            "stars_month": 3200,
            "trending_score": 89.5,
            "category": "Web Development",
            "license": "MIT",
        },
    ]
    
    for data in sample_repos:
        existing = db.query(GitHubRepo).filter(GitHubRepo.full_name == data["full_name"]).first()
        if not existing:
            repo = GitHubRepo(**data, is_processed=True)
            db.add(repo)
    
    db.commit()
    print(f"Seeded {len(sample_repos)} repositories")


def seed_trends(db):
    """Seed sample trends."""
    sample_trends = [
        {
            "name": "Artificial Intelligence",
            "slug": "artificial-intelligence",
            "category": "technology",
            "description": "AI and Machine Learning technologies",
            "mention_count": 150,
            "article_count": 80,
            "repo_count": 70,
            "popularity_score": 95.0,
            "growth_score": 88.5,
            "overall_score": 91.75,
        },
        {
            "name": "Python",
            "slug": "python",
            "category": "programming_language",
            "description": "Python programming language",
            "mention_count": 120,
            "article_count": 40,
            "repo_count": 80,
            "popularity_score": 92.0,
            "growth_score": 75.0,
            "overall_score": 83.5,
        },
        {
            "name": "Kubernetes",
            "slug": "kubernetes",
            "category": "technology",
            "description": "Container orchestration platform",
            "mention_count": 85,
            "article_count": 35,
            "repo_count": 50,
            "popularity_score": 85.0,
            "growth_score": 70.0,
            "overall_score": 77.5,
        },
        {
            "name": "React",
            "slug": "react",
            "category": "framework",
            "description": "JavaScript library for building user interfaces",
            "mention_count": 100,
            "article_count": 45,
            "repo_count": 55,
            "popularity_score": 88.0,
            "growth_score": 65.0,
            "overall_score": 76.5,
        },
        {
            "name": "Rust",
            "slug": "rust",
            "category": "programming_language",
            "description": "Systems programming language",
            "mention_count": 70,
            "article_count": 30,
            "repo_count": 40,
            "popularity_score": 78.0,
            "growth_score": 92.0,
            "overall_score": 85.0,
        },
    ]
    
    for data in sample_trends:
        existing = db.query(Trend).filter(Trend.slug == data["slug"]).first()
        if not existing:
            trend = Trend(**data)
            db.add(trend)
    
    db.commit()
    print(f"Seeded {len(sample_trends)} trends")


def seed_tags(db):
    """Seed sample tags."""
    sample_tags = [
        {"name": "python", "slug": "python", "category": "language"},
        {"name": "javascript", "slug": "javascript", "category": "language"},
        {"name": "machine-learning", "slug": "machine-learning", "category": "technology"},
        {"name": "ai", "slug": "ai", "category": "technology"},
        {"name": "kubernetes", "slug": "kubernetes", "category": "technology"},
        {"name": "docker", "slug": "docker", "category": "technology"},
        {"name": "react", "slug": "react", "category": "framework"},
        {"name": "startup", "slug": "startup", "category": "business"},
    ]
    
    for data in sample_tags:
        existing = db.query(Tag).filter(Tag.slug == data["slug"]).first()
        if not existing:
            tag = Tag(**data)
            db.add(tag)
    
    db.commit()
    print(f"Seeded {len(sample_tags)} tags")


if __name__ == "__main__":
    print("Seeding database with sample data...")
    
    db = SessionLocal()
    try:
        seed_tags(db)
        seed_articles(db)
        seed_repos(db)
        seed_trends(db)
        print("\nDatabase seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
