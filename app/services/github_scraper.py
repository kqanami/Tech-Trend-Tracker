"""GitHub Trending scraper."""
import logging
import re
import json
from datetime import datetime
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

from app.utils.http_client import HTTPClient
from app.utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)


class GitHubScraper:
    """Scraper for GitHub trending repositories."""
    
    BASE_URL = "https://github.com"
    TRENDING_URL = "https://github.com/trending"
    API_URL = "https://api.github.com"
    
    def __init__(self):
        self.http_client = HTTPClient(delay=1.5)
        self.text_processor = TextProcessor()
    
    def _parse_repo_from_trending(self, article_elem: BeautifulSoup, time_range: str) -> Optional[Dict]:
        """Parse a repository from trending page."""
        try:
            h2_elem = article_elem.find('h2')
            if not h2_elem:
                return None
            
            full_name = h2_elem.get_text(strip=True).replace(' ', '')
            if '/' not in full_name:
                return None
            
            owner, name = full_name.split('/', 1)
            url = f"{self.BASE_URL}/{full_name}"
            
            desc_elem = article_elem.find('p', class_='col-9')
            description = self.text_processor.normalize_text(desc_elem.get_text(), max_length=500) if desc_elem else None
            
            lang_elem = article_elem.find('span', itemprop='programmingLanguage')
            language = lang_elem.get_text(strip=True) if lang_elem else None
            
            stars = 0
            stars_elem = article_elem.find('a', href=lambda x: x and 'stargazers' in x)
            if stars_elem:
                stars_text = stars_elem.get_text(strip=True).replace(',', '')
                try:
                    stars = int(stars_text)
                except ValueError:
                    pass
            
            forks = 0
            forks_elem = article_elem.find('a', href=lambda x: x and 'forks' in x)
            if forks_elem:
                forks_text = forks_elem.get_text(strip=True).replace(',', '')
                try:
                    forks = int(forks_text)
                except ValueError:
                    pass
            
            stars_today = 0
            stars_today_elem = article_elem.find('span', class_='d-inline-block float-sm-right')
            if stars_today_elem:
                today_text = stars_today_elem.get_text(strip=True)
                match = re.search(r'(\d+)', today_text.replace(',', ''))
                if match:
                    stars_today = int(match.group(1))
            
            topics = []
            topic_elems = article_elem.find_all('a', class_='topic-tag')
            for topic_elem in topic_elems:
                topic = topic_elem.get_text(strip=True)
                if topic:
                    topics.append(topic)
            
            trending_score = self._calculate_trending_score(stars, stars_today, forks)
            
            return {
                "name": name,
                "full_name": full_name,
                "owner": owner,
                "url": url,
                "description": description,
                "language": language,
                "topics": json.dumps(topics),
                "stars": stars,
                "forks": forks,
                "stars_today": stars_today if time_range == "daily" else 0,
                "stars_week": stars_today if time_range == "weekly" else 0,
                "stars_month": stars_today if time_range == "monthly" else 0,
                "trending_score": trending_score,
            }
            
        except Exception as e:
            logger.error(f"Error parsing trending repo: {e}")
            return None
    
    def _calculate_trending_score(self, stars: int, stars_today: int, forks: int) -> float:
        """Calculate trending score based on various metrics."""
        import math
        score = stars_today * 10
        score += math.log10(stars + 1) * 5
        score += math.log10(forks + 1) * 2
        return round(score, 2)
    
    def scrape_trending(self, language: Optional[str] = None, 
                       time_range: str = "daily",
                       limit: int = 25) -> List[Dict]:
        """Scrape trending repositories."""
        url = self.TRENDING_URL
        if language:
            url += f"/{language}"
        url += f"?since={time_range}"
        
        repos = []
        
        try:
            logger.info(f"Scraping GitHub trending: {url}")
            response = self.http_client.get(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            article_elems = soup.find_all('article', class_='Box-row')
            
            for elem in article_elems[:limit]:
                repo = self._parse_repo_from_trending(elem, time_range)
                if repo:
                    repos.append(repo)
            
            logger.info(f"Found {len(repos)} trending repos")
            
        except Exception as e:
            logger.error(f"Error scraping trending repos: {e}")
        
        return repos
    
    def fetch_repo_details(self, owner: str, repo: str) -> Optional[Dict]:
        """Fetch detailed repo info from GitHub API."""
        url = f"{self.API_URL}/repos/{owner}/{repo}"
        
        try:
            response = self.http_client.get_with_github_auth(url)
            data = response.json()
            
            return {
                "repo_id": data.get("id"),
                "name": data.get("name"),
                "full_name": data.get("full_name"),
                "owner": data.get("owner", {}).get("login"),
                "url": data.get("html_url"),
                "description": data.get("description"),
                "language": data.get("language"),
                "topics": json.dumps(data.get("topics", [])),
                "stars": data.get("stargazers_count", 0),
                "forks": data.get("forks_count", 0),
                "open_issues": data.get("open_issues_count", 0),
                "watchers": data.get("watchers_count", 0),
                "created_at": self.text_processor.parse_date(data.get("created_at")),
                "updated_at": self.text_processor.parse_date(data.get("updated_at")),
                "pushed_at": self.text_processor.parse_date(data.get("pushed_at")),
                "license": data.get("license", {}).get("name") if data.get("license") else None,
                "is_fork": data.get("fork", False),
                "is_archived": data.get("archived", False),
            }
            
        except Exception as e:
            logger.error(f"Error fetching repo details for {owner}/{repo}: {e}")
            return None
    
    def scrape_all_languages(self, time_range: str = "daily", 
                            limit_per_lang: int = 10) -> List[Dict]:
        """Scrape trending repos for popular languages."""
        popular_languages = ["python", "javascript", "typescript", "go", "rust", "java"]
        
        all_repos = []
        seen_names = set()
        
        # Scrape general trending first
        trending = self.scrape_trending(language=None, time_range=time_range, limit=limit_per_lang)
        for repo in trending:
            if repo['full_name'] not in seen_names:
                all_repos.append(repo)
                seen_names.add(repo['full_name'])
        
        # Scrape each language
        for language in popular_languages:
            try:
                repos = self.scrape_trending(language=language, 
                                            time_range=time_range, 
                                            limit=limit_per_lang)
                for repo in repos:
                    if repo['full_name'] not in seen_names:
                        all_repos.append(repo)
                        seen_names.add(repo['full_name'])
            except Exception as e:
                logger.error(f"Error scraping language {language}: {e}")
                continue
        
        logger.info(f"Total unique trending repos: {len(all_repos)}")
        return all_repos
