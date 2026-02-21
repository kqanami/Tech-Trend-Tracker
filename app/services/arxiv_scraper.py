"""ArXiv news scraper for research papers."""
import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Optional

from app.utils.http_client import HTTPClient
from app.utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)


class ArXivScraper:
    """Scraper for ArXiv papers in tech categories."""
    
    API_URL = "http://export.arxiv.org/api/query"
    # Categories: Computer Science (Architecture, AI, Data Structures, etc.)
    CATEGORIES = ["cs.AI", "cs.LG", "cs.DC", "cs.CV", "cs.NE"]
    
    def __init__(self):
        self.http_client = HTTPClient(delay=3.0) # ArXiv requires 3s delay
        self.text_processor = TextProcessor()
        
    def scrape_latest(self, limit: int = 10) -> List[Dict]:
        """Scrape latest papers from ArXiv."""
        articles = []
        try:
            # Query for tech categories
            cat_query = " OR ".join([f"cat:{cat}" for cat in self.CATEGORIES])
            url = f"{self.API_URL}?search_query=({cat_query})&sortBy=submittedDate&sortOrder=descending&max_results={limit}"
            
            logger.info(f"Fetching from ArXiv: {url}")
            response = self.http_client.get(url)
            
            # Parse XML response
            root = ET.fromstring(response.content)
            
            # ArXiv uses Atom format with 'http://www.w3.org/2005/Atom' namespace
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            
            for entry in root.findall('atom:entry', ns):
                title = entry.find('atom:title', ns).text.strip()
                title = self.text_processor.normalize_text(title)
                
                summary = entry.find('atom:summary', ns).text.strip()
                summary = self.text_processor.normalize_text(summary, max_length=1000)
                
                url = entry.find("atom:id", ns).text
                
                published_str = entry.find('atom:published', ns).text
                published_at = self.text_processor.parse_date(published_str)
                
                author_elem = entry.find('atom:author/atom:name', ns)
                author = author_elem.text if author_elem is not None else "ArXiv Researcher"
                
                # Try to get primary category
                primary_cat_elem = entry.find('atom:category', ns)
                category = "Research"
                if primary_cat_elem is not None:
                    category = primary_cat_elem.get('term', 'Research')
                
                articles.append({
                    "title": title,
                    "url": url,
                    "source": "arxiv",
                    "author": author,
                    "summary": summary,
                    "content": None,
                    "published_at": published_at,
                    "category": category,
                    "image_url": None,
                    "language": "en",
                })
                
            logger.info(f"Found {len(articles)} papers on ArXiv")
        except Exception as e:
            logger.error(f"Error scraping ArXiv: {e}")
            
        return articles
