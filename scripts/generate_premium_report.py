"""Script to generate a Premium Tech Trend Report for fast monetization."""
import json
import os
from datetime import datetime, timedelta
from sqlalchemy import desc
from app.db.database import SessionLocal
from app.models.article import Article
from app.models.github_repo import GitHubRepo
from app.models.trend import Trend

def generate_report():
    print("🚀 Generating Premium Tech Trend Report...")
    db = SessionLocal()
    try:
        # 1. Top Trending Technologies
        trends = db.query(Trend).order_by(desc(Trend.overall_score)).limit(5).all()
        
        # 2. Latest High-Sentiment Articles
        articles = db.query(Article).filter(Article.sentiment_score > 0.5).order_by(desc(Article.published_at)).limit(5).all()
        
        # 3. Fast-Growing GitHub Repos
        repos = db.query(GitHubRepo).order_by(desc(GitHubRepo.trending_score)).limit(5).all()
        
        report_data = {
            "title": "PREMIUM TECH TREND REPORT",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "top_trends": [
                {"name": t.name, "score": round(t.overall_score, 2), "growth": t.category} for t in trends
            ],
            "hot_articles": [
                {"title": a.title, "sentiment": a.sentiment_score, "url": a.url} for a in articles
            ],
            "rising_repos": [
                {"name": r.name, "stars": r.stars, "score": r.trending_score} for r in repos
            ]
        }
        
        # Save as Markdown
        report_path = "PREMIUM_TECH_REPORT.md"
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(f"# 💎 {report_data['title']}\n\n")
            f.write(f"**Date:** {report_data['date']}\n\n")
            
            f.write("## 🔥 Top Trending Technologies\n")
            for t in report_data['top_trends']:
                f.write(f"- **{t['name']}** (Score: {t['score']}) - {t['growth']}\n")
                
            f.write("\n## 📰 Hot Articles (Positive Sentiment)\n")
            for a in report_data['hot_articles']:
                f.write(f"- [{a['title']}]({a['url']}) (Sentiment: {a['sentiment']})\n")
                
            f.write("\n## 🚀 Rising Repositories\n")
            for r in report_data['rising_repos']:
                f.write(f"- **{r['name']}** ({r['stars']} stars) - Trending Score: {r['score']}\n")
                
            f.write("\n\n---\n*This report was generated using Tech-Trend-Tracker ML Core.*")
            
        print(f"✅ Report generated: {report_path}")
        return report_path
    finally:
        db.close()

if __name__ == "__main__":
    generate_report()
