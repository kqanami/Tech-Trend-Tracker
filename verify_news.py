
import sys
import os
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.hackernews_scraper import HackerNewsScraper
from app.services.arxiv_scraper import ArXivScraper
from app.services.ml_analyzer import MLAnalyzer

def verify_new_features():
    print("=" * 60)
    print("🔍 VERIFYING NEWS SEARCH AND ANALYSIS")
    print("=" * 60)
    
    analyzer = MLAnalyzer()
    
    # 1. Test HackerNews
    print("\n[1/2] Testing HackerNews Scraper...")
    hn = HackerNewsScraper()
    hn_stories = hn.scrape_latest(limit=3)
    print(f"✅ Found {len(hn_stories)} HN stories")
    for story in hn_stories:
        analysis = analyzer.analyze_article(story)
        print(f"   - {story['title']}")
        print(f"     Verdict: {analysis['technical_analysis']}")
        
    # 2. Test ArXiv
    print("\n[2/2] Testing ArXiv Scraper...")
    arxiv = ArXivScraper()
    arxiv_papers = arxiv.scrape_latest(limit=3)
    print(f"✅ Found {len(arxiv_papers)} ArXiv papers")
    for paper in arxiv_papers:
        analysis = analyzer.analyze_article(paper)
        print(f"   - {paper['title']}")
        print(f"     Verdict: {analysis['technical_analysis']}")

    print("\n" + "=" * 60)
    print("✨ Verification complete!")

if __name__ == "__main__":
    verify_new_features()
