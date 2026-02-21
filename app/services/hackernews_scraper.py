"""HackerNews news scraper."""
import logging
from datetime import datetime
from typing import List, Dict, Optional

from app.utils.http_client import HTTPClient
from app.utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)


class HackerNewsScraper:
    """Scraper for HackerNews articles using their Firebase API."""
    
    API_BASE_URL = "https://hacker-news.firebaseio.com/v0"
    ITEM_URL = f"{API_BASE_URL}/item"
    TOP_STORIES_URL = f"{API_BASE_URL}/topstories.json"
    WEB_URL = "https://news.ycombinator.com/item?id="
    
    def __init__(self):
        self.http_client = HTTPClient(delay=0.5)
        self.text_processor = TextProcessor()
        
    def fetch_story(self, story_id: int) -> Optional[Dict]:
        """Fetch a single story by ID."""
        try:
            url = f"{self.ITEM_URL}/{story_id}.json"
            response = self.http_client.get(url)
            data = response.json()
            
            if not data or data.get('type') != 'story' or data.get('deleted'):
                return None
            
            title = self.text_processor.normalize_text(data.get('title'))
            if not title:
                return None
                
            url = data.get('url') or f"{self.WEB_URL}{story_id}"
            
            # HN provides time in Unix timestamp
            published_at = datetime.fromtimestamp(data.get('time')) if data.get('time') else datetime.utcnow()
            
            return {
                "title": title,
                "url": url,
                "source": "hackernews",
                "author": data.get('by'),
                "summary": f"HackerNews story by {data.get('by')}. Score: {data.get('score', 0)}",
                "content": None,
                "published_at": published_at,
                "category": "general",
                "image_url": None,
                "language": "en",
            }
        except Exception as e:
            logger.error(f"Error fetching HN story {story_id}: {e}")
            return None

    def scrape_latest(self, limit: int = 20) -> List[Dict]:
        """Scrape top stories from HackerNews."""
        articles = []
        try:
            logger.info(f"Fetching top stories from HackerNews (limit: {limit})")
            response = self.http_client.get(self.TOP_STORIES_URL)
            story_ids = response.json()
            
            if not story_ids:
                return []
                
            for story_id in story_ids[:limit]:
                story = self.fetch_story(story_id)
                if story:
                    articles.append(story)
                    
            logger.info(f"Found {len(articles)} stories on HackerNews")
        except Exception as e:
            logger.error(f"Error scraping HackerNews: {e}")
            
        return articles
