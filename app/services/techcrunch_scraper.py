"""TechCrunch news scraper - Improved version."""
import logging
import re
from datetime import datetime
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from app.utils.http_client import HTTPClient
from app.utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)


class TechCrunchScraper:
    """Improved scraper for TechCrunch articles with better parsing."""
    
    BASE_URL = "https://techcrunch.com"
    CATEGORIES = [
        "startups", "venture", "security", "artificial-intelligence", 
        "crypto", "apps", "enterprise", "hardware", "mobile", "gadgets"
    ]
    
    def __init__(self):
        self.http_client = HTTPClient(delay=2.0)
        self.text_processor = TextProcessor()
    
    def _normalize_url(self, url: str) -> str:
        """Normalize URL to full absolute URL."""
        if not url:
            return ""
        
        # Remove query parameters and fragments
        url = url.split('?')[0].split('#')[0]
        # Remove trailing slash
        url = url.rstrip('/')
        
        if url.startswith('http://') or url.startswith('https://'):
            return url
        elif url.startswith('//'):
            return 'https:' + url
        elif url.startswith('/'):
            return self.BASE_URL + url
        else:
            return urljoin(self.BASE_URL, url)
    
    def _extract_title(self, article_elem: BeautifulSoup) -> Optional[str]:
        """Extract article title with multiple fallback strategies."""
        # Strategy 1: Look for h2 with class containing 'post-title' or 'entry-title'
        title_elem = (
            article_elem.find('h2', class_=re.compile(r'post-title|entry-title|title|headline', re.I)) or
            article_elem.find('h3', class_=re.compile(r'post-title|entry-title|title|headline', re.I)) or
            article_elem.find('h2') or
            article_elem.find('h3') or
            article_elem.find('h1')
        )
        
        if title_elem:
            # Try to get text from link inside title
            link = title_elem.find('a')
            if link:
                title = link.get_text(strip=True)
            else:
                title = title_elem.get_text(strip=True)
            
            if title:
                return self.text_processor.normalize_text(title)
        
        # Strategy 2: Look for meta tags
        meta_title = article_elem.find('meta', property='og:title')
        if meta_title and meta_title.get('content'):
            return self.text_processor.normalize_text(meta_title['content'])
        
        return None
    
    def _extract_url(self, article_elem: BeautifulSoup) -> Optional[str]:
        """Extract article URL with multiple fallback strategies."""
        # Strategy 1: Look for link in title
        title_elem = article_elem.find('h2') or article_elem.find('h3')
        if title_elem:
            link = title_elem.find('a', href=True)
            if link:
                return self._normalize_url(link['href'])
        
        # Strategy 2: Look for any link with class containing 'post-link' or 'entry-link'
        link_elem = (
            article_elem.find('a', class_=re.compile(r'post-link|entry-link|article-link', re.I), href=True) or
            article_elem.find('a', href=True)
        )
        
        if link_elem:
            href = link_elem.get('href')
            if href:
                normalized = self._normalize_url(href)
                # Filter out non-article URLs
                if 'techcrunch.com' in normalized and not any(x in normalized for x in ['/author/', '/tag/', '/category/']):
                    return normalized
        
        # Strategy 3: Look for canonical link
        canonical = article_elem.find('link', rel='canonical')
        if canonical and canonical.get('href'):
            return self._normalize_url(canonical['href'])
        
        return None
    
    def _extract_author(self, article_elem: BeautifulSoup) -> Optional[str]:
        """Extract author name with multiple strategies."""
        # Strategy 1: Look for author link
        author_elem = (
            article_elem.find('a', attrs={'aria-label': lambda x: x and 'author' in x.lower()}) or
            article_elem.find('a', class_=re.compile(r'author|byline', re.I)) or
            article_elem.find('span', class_=re.compile(r'author|byline', re.I)) or
            article_elem.find('div', class_=re.compile(r'author|byline', re.I))
        )
        
        if author_elem:
            author = author_elem.get_text(strip=True)
            if author and len(author) < 100:  # Sanity check
                return author
        
        # Strategy 2: Look for meta author
        meta_author = article_elem.find('meta', attrs={'name': re.compile(r'author', re.I)})
        if meta_author and meta_author.get('content'):
            return meta_author['content'].strip()
        
        return None
    
    def _extract_summary(self, article_elem: BeautifulSoup) -> Optional[str]:
        """Extract article summary/excerpt with multiple strategies."""
        # Strategy 1: Look for excerpt/description paragraph
        excerpt_elem = (
            article_elem.find('p', class_=re.compile(r'excerpt|summary|description|deck', re.I)) or
            article_elem.find('div', class_=re.compile(r'excerpt|summary|description', re.I)) or
            article_elem.find('p')
        )
        
        if excerpt_elem:
            summary = excerpt_elem.get_text(strip=True)
            if summary and len(summary) > 20:  # Minimum length check
                return self.text_processor.normalize_text(summary, max_length=1000)
        
        # Strategy 2: Look for meta description
        meta_desc = article_elem.find('meta', attrs={'name': 'description'}) or \
                   article_elem.find('meta', property='og:description')
        if meta_desc and meta_desc.get('content'):
            desc = meta_desc['content'].strip()
            if desc:
                return self.text_processor.normalize_text(desc, max_length=1000)
        
        return None
    
    def _extract_image(self, article_elem: BeautifulSoup) -> Optional[str]:
        """Extract article image URL with multiple strategies."""
        # Strategy 1: Look for featured image
        img_elem = (
            article_elem.find('img', class_=re.compile(r'featured|thumbnail|post-image', re.I)) or
            article_elem.find('img', attrs={'data-src': True}) or
            article_elem.find('img', src=True)
        )
        
        if img_elem:
            # Try multiple attributes
            img_url = (
                img_elem.get('data-src') or
                img_elem.get('data-lazy-src') or
                img_elem.get('src') or
                img_elem.get('srcset', '').split(',')[0].strip().split(' ')[0] if img_elem.get('srcset') else None
            )
            
            if img_url:
                img_url = self._normalize_url(img_url)
                # Filter out small images and icons
                if not any(x in img_url.lower() for x in ['icon', 'logo', 'avatar', 'placeholder']):
                    return img_url
        
        # Strategy 2: Look for og:image
        og_image = article_elem.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            return self._normalize_url(og_image['content'])
        
        return None
    
    def _extract_published_date(self, article_elem: BeautifulSoup) -> Optional[datetime]:
        """Extract published date with multiple strategies."""
        # Strategy 1: Look for time element with datetime
        time_elem = article_elem.find('time', datetime=True) or article_elem.find('time')
        if time_elem:
            datetime_str = time_elem.get('datetime') or time_elem.get_text(strip=True)
            if datetime_str:
                try:
                    return self.text_processor.parse_date(datetime_str)
                except:
                    pass
        
        # Strategy 2: Look for meta published time
        meta_time = (
            article_elem.find('meta', property='article:published_time') or
            article_elem.find('meta', attrs={'name': 'publishdate'}) or
            article_elem.find('meta', attrs={'name': 'pubdate'})
        )
        if meta_time and meta_time.get('content'):
            try:
                return self.text_processor.parse_date(meta_time['content'])
            except:
                pass
        
        return None
    
    def _extract_content(self, url: str) -> Optional[str]:
        """Extract full article content from article page."""
        try:
            response = self.http_client.get(url, timeout=15.0)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Look for article content
            content_elem = (
                soup.find('div', class_=re.compile(r'article-content|entry-content|post-content', re.I)) or
                soup.find('article', class_=re.compile(r'content|entry', re.I)) or
                soup.find('div', class_=re.compile(r'content-body|article-body', re.I))
            )
            
            if content_elem:
                # Remove script and style elements
                for script in content_elem(["script", "style", "nav", "aside", "footer", "header"]):
                    script.decompose()
                
                # Get text
                content = content_elem.get_text(separator='\n', strip=True)
                if content and len(content) > 100:  # Minimum content length
                    return self.text_processor.normalize_text(content, max_length=5000)
            
            return None
        except Exception as e:
            logger.debug(f"Could not extract content from {url}: {e}")
            return None
    
    def _parse_article(self, article_elem: BeautifulSoup, category: str, fetch_content: bool = False) -> Optional[Dict]:
        """Parse a single article element with improved extraction."""
        try:
            title = self._extract_title(article_elem)
            if not title:
                return None
            
            url = self._extract_url(article_elem)
            if not url:
                return None
            
            # Validate URL
            parsed = urlparse(url)
            if not parsed.netloc or 'techcrunch.com' not in parsed.netloc:
                return None
            
            author = self._extract_author(article_elem)
            summary = self._extract_summary(article_elem)
            image_url = self._extract_image(article_elem)
            published_at = self._extract_published_date(article_elem)
            
            # Extract content if requested
            content = None
            if fetch_content:
                content = self._extract_content(url)
            
            article_data = {
                "title": title,
                "url": url,
                "source": "techcrunch",
                "author": author,
                "summary": summary,
                "content": content,
                "published_at": published_at,
                "category": category,
                "image_url": image_url,
                "language": "en",
            }
            
            # Validate that we have at least title and URL
            if article_data["title"] and article_data["url"]:
                return article_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error parsing article: {e}", exc_info=True)
            return None
    
    def scrape_category(self, category: str, limit: int = 10, fetch_content: bool = False) -> List[Dict]:
        """Scrape articles from a specific category with improved parsing."""
        url = f"{self.BASE_URL}/category/{category}/"
        articles = []
        seen_urls = set()
        
        try:
            logger.info(f"Scraping TechCrunch category: {category}")
            response = self.http_client.get(url, timeout=15.0)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Multiple strategies to find articles
            article_elems = []
            
            # Strategy 1: Look for article tags
            article_elems.extend(soup.find_all('article', limit=limit * 3))
            
            # Strategy 2: Look for post items
            if len(article_elems) < limit:
                article_elems.extend(soup.find_all('div', class_=re.compile(r'post|entry|article', re.I), limit=limit * 2))
            
            # Strategy 3: Look for any div with article-like structure
            if len(article_elems) < limit:
                for div in soup.find_all('div', class_=True, limit=limit * 5):
                    classes = ' '.join(div.get('class', [])).lower()
                    if any(x in classes for x in ['post', 'entry', 'article', 'story', 'item']):
                        if div.find('h2') or div.find('h3'):
                            article_elems.append(div)
            
            logger.debug(f"Found {len(article_elems)} potential article elements")
            
            for elem in article_elems:
                if len(articles) >= limit:
                    break
                
                article = self._parse_article(elem, category, fetch_content=fetch_content)
                if article and article['url'] not in seen_urls:
                    articles.append(article)
                    seen_urls.add(article['url'])
            
            logger.info(f"Found {len(articles)} unique articles in category '{category}'")
            
        except Exception as e:
            logger.error(f"Error scraping category {category}: {e}", exc_info=True)
        
        return articles
    
    def scrape_latest(self, limit: int = 20, fetch_content: bool = False) -> List[Dict]:
        """Scrape latest articles from homepage with improved parsing."""
        articles = []
        seen_urls = set()
        
        try:
            logger.info("Scraping TechCrunch latest articles")
            response = self.http_client.get(self.BASE_URL, timeout=15.0)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Multiple strategies to find articles
            article_elems = []
            
            # Strategy 1: Look for article tags
            article_elems.extend(soup.find_all('article', limit=limit * 3))
            
            # Strategy 2: Look for post items
            if len(article_elems) < limit:
                article_elems.extend(soup.find_all('div', class_=re.compile(r'post|entry|article|story', re.I), limit=limit * 2))
            
            # Strategy 3: Look in main content area
            main_content = soup.find('main') or soup.find('div', class_=re.compile(r'content|main', re.I))
            if main_content and len(article_elems) < limit:
                article_elems.extend(main_content.find_all(['article', 'div'], class_=re.compile(r'post|entry|article', re.I), limit=limit * 2))
            
            logger.debug(f"Found {len(article_elems)} potential article elements on homepage")
            
            for elem in article_elems:
                if len(articles) >= limit:
                    break
                
                article = self._parse_article(elem, "general", fetch_content=fetch_content)
                if article and article['url'] not in seen_urls:
                    articles.append(article)
                    seen_urls.add(article['url'])
            
            logger.info(f"Found {len(articles)} unique latest articles")
            
        except Exception as e:
            logger.error(f"Error scraping latest articles: {e}", exc_info=True)
        
        return articles
    
    def scrape_all_categories(self, limit_per_category: int = 10, fetch_content: bool = False, 
                             only_recent: bool = True, days_back: int = 7) -> List[Dict]:
        """Scrape articles from all categories with deduplication and optional date filtering."""
        from datetime import datetime, timedelta
        
        all_articles = []
        seen_urls = set()
        cutoff_date = None
        
        if only_recent:
            cutoff_date = datetime.utcnow() - timedelta(days=days_back)
            logger.info(f"Filtering articles published after {cutoff_date.strftime('%Y-%m-%d')}")
        
        # Scrape homepage first
        logger.info("Scraping TechCrunch homepage...")
        latest = self.scrape_latest(limit=limit_per_category * 2, fetch_content=fetch_content)
        for article in latest:
            url = article.get('url', '')
            if not url or url in seen_urls:
                continue
            
            # Filter by date if requested
            if only_recent and cutoff_date:
                pub_date = article.get('published_at')
                if pub_date and isinstance(pub_date, datetime):
                    if pub_date < cutoff_date:
                        logger.debug(f"Skipping old article: {article.get('title', '')[:50]}")
                        continue
                elif pub_date is None:
                    # If no date, include it (might be recent)
                    pass
            
            all_articles.append(article)
            seen_urls.add(url)
        
        # Scrape each category
        for category in self.CATEGORIES:
            try:
                logger.info(f"Scraping category: {category}")
                articles = self.scrape_category(category, limit=limit_per_category * 2, fetch_content=fetch_content)
                for article in articles:
                    url = article.get('url', '')
                    if not url or url in seen_urls:
                        continue
                    
                    # Filter by date if requested
                    if only_recent and cutoff_date:
                        pub_date = article.get('published_at')
                        if pub_date and isinstance(pub_date, datetime):
                            if pub_date < cutoff_date:
                                logger.debug(f"Skipping old article from {category}: {article.get('title', '')[:50]}")
                                continue
                    
                    all_articles.append(article)
                    seen_urls.add(url)
                    
                    # Stop if we have enough recent articles
                    if only_recent and len(all_articles) >= limit_per_category * 3:
                        break
                
                if only_recent and len(all_articles) >= limit_per_category * 3:
                    break
                    
            except Exception as e:
                logger.error(f"Error scraping category {category}: {e}", exc_info=True)
                continue
        
        logger.info(f"Total unique articles scraped: {len(all_articles)} (filtered by date: {only_recent})")
        return all_articles
