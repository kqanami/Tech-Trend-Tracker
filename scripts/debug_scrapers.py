
import sys
import os
import logging

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up logging to console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from app.services.hackernews_scraper import HackerNewsScraper
from app.services.arxiv_scraper import ArXivScraper
# from app.services.techcrunch_scraper import TechCrunchScraper

def debug_scrapers():
    print("search_web Tool: Checking Internet Connection/Content...")
    
    # 1. Test HackerNews
    print("\n" + "="*50)
    print("Testing HackerNewsScraper...")
    try:
        hn_scraper = HackerNewsScraper()
        # Fetch only 5 to be quick
        articles = hn_scraper.scrape_latest(limit=5)
        print(f"✅ HackerNews returned {len(articles)} articles.")
        for i, a in enumerate(articles):
            print(f"  [{i+1}] {a.get('title')} ({a.get('url')})")
            print(f"       Date: {a.get('published_at')}")
    except Exception as e:
        print(f"❌ HackerNews failed: {e}")
        import traceback
        traceback.print_exc()

    # 2. Test ArXiv
    print("\n" + "="*50)
    print("Testing ArXivScraper...")
    try:
        arxiv_scraper = ArXivScraper()
        articles = arxiv_scraper.scrape_latest(limit=5)
        print(f"✅ ArXiv returned {len(articles)} articles.")
        for i, a in enumerate(articles):
            print(f"  [{i+1}] {a.get('title')}")
            print(f"       Category: {a.get('category')}")
    except Exception as e:
        print(f"❌ ArXiv failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_scrapers()
