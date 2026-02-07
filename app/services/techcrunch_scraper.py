"""TechCrunch news scraper."""
import logging
from datetime import datetime
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

from app.utils.http_client import HTTPClient
from app.utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)


class TechCrunchScraper:
    """Scraper for TechCrunch articles."""
    
    BASE_URL = "https://techcrunch.com"
    CATEGORIES = ["startups", "venture", "security", "artificial-intelligence", "crypto", "apps"]
    
    def __init__(self):
        self.http_client = HTTPClient(delay=2.0)
        self.text_processor = TextProcessor()
    
    def _parse_article(self, article_elem: BeautifulSoup, category: str) -> Optional[Dict]:
        """Parse a single article element."""
        try:
            title_elem = article_elem.find('h2') or article_elem.find('h3')
            if not title_elem:
                return None
            
            title = self.text_processor.normalize_text(title_elem.get_text())
            if not title:
                return None
            
            link_elem = article_elem.find('a', href=True)
            if not link_elem:
                return None
            
            url = link_elem['href']
            if url.startswith('/'):
                url = self.BASE_URL + url
            
            author_elem = article_elem.find('a', attrs={'aria-label': lambda x: x and 'author' in x.lower()})
            author = author_elem.get_text(strip=True) if author_elem else None
            
            excerpt_elem = article_elem.find('p')
            summary = self.text_processor.normalize_text(excerpt_elem.get_text(), max_length=500) if excerpt_elem else None
            
            img_elem = article_elem.find('img')
            image_url = img_elem.get('src') or img_elem.get('data-src') if img_elem else None
            
            time_elem = article_elem.find('time')
            published_at = None
            if time_elem:
                datetime_str = time_elem.get('datetime')
                if datetime_str:
                    published_at = self.text_processor.parse_date(datetime_str)
            
            return {
                "title": title,
                "url": url,
                "source": "techcrunch",
                "author": author,
                "summary": summary,
                "content": None,
                "published_at": published_at,
                "category": category,
                "image_url": image_url,
                "language": "en",
            }
            
        except Exception as e:
            logger.error(f"Error parsing article: {e}")
            return None
    
    def scrape_category(self, category: str, limit: int = 10) -> List[Dict]:
        """Scrape articles from a specific category."""
        url = f"{self.BASE_URL}/category/{category}/"
        articles = []
        
        try:
            logger.info(f"Scraping TechCrunch category: {category}")
            response = self.http_client.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            article_elems = soup.find_all('article', limit=limit * 2)
            
            for elem in article_elems:
                if len(articles) >= limit:
                    break
                
                article = self._parse_article(elem, category)
                if article:
                    articles.append(article)
            
            logger.info(f"Found {len(articles)} articles in category '{category}'")
            
        except Exception as e:
            logger.error(f"Error scraping category {category}: {e}")
        
        return articles
    
    def scrape_latest(self, limit: int = 20) -> List[Dict]:
        """Scrape latest articles from homepage."""
        articles = []
        
        try:
            logger.info("Scraping TechCrunch latest articles")
            response = self.http_client.get(self.BASE_URL)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            article_elems = soup.find_all('article', limit=limit * 2)
            
            for elem in article_elems:
                if len(articles) >= limit:
                    break
                
                article = self._parse_article(elem, "general")
                if article:
                    articles.append(article)
            
            logger.info(f"Found {len(articles)} latest articles")
            
        except Exception as e:
            logger.error(f"Error scraping latest articles: {e}")
        
        return articles
    
    def scrape_all_categories(self, limit_per_category: int = 10) -> List[Dict]:
        """Scrape articles from all categories."""
        all_articles = []
        seen_urls = set()
        
        # Scrape homepage first
        latest = self.scrape_latest(limit=limit_per_category)
        for article in latest:
            if article['url'] not in seen_urls:
                all_articles.append(article)
                seen_urls.add(article['url'])
        
        # Scrape each category
        for category in self.CATEGORIES:
            try:
                articles = self.scrape_category(category, limit=limit_per_category)
                for article in articles:
                    if article['url'] not in seen_urls:
                        all_articles.append(article)
                        seen_urls.add(article['url'])
            except Exception as e:
                logger.error(f"Error scraping category {category}: {e}")
                continue
        
        logger.info(f"Total unique articles scraped: {len(all_articles)}")
        return all_articles
