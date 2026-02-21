
import sys
import os
from bs4 import BeautifulSoup

# Add the project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.techcrunch_scraper import TechCrunchScraper
from app.utils.http_client import HTTPClient

def test_techcrunch():
    print("Testing TechCrunch Scraper...")
    scraper = TechCrunchScraper()
    
    # Test homepage scraping
    print(f"Scraping homepage: {scraper.BASE_URL}")
    articles = scraper.scrape_latest(limit=5)
    
    print(f"Found {len(articles)} articles on homepage.")
    for i, article in enumerate(articles):
        print(f"{i+1}. {article['title']}")
        print(f"   URL: {article['url']}")
        print(f"   Category: {article['category']}")
    
    # Test category scraping
    category = "artificial-intelligence"
    print(f"\nScraping category: {category}")
    cat_articles = scraper.scrape_category(category, limit=5)
    print(f"Found {len(cat_articles)} articles in category {category}.")
    for i, article in enumerate(cat_articles):
        print(f"{i+1}. {article['title']}")

if __name__ == "__main__":
    test_techcrunch()
