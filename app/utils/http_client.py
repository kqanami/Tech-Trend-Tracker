"""HTTP client with retry logic and user-agent rotation."""
import random
import time
from typing import Optional, Dict
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings


class HTTPClient:
    """HTTP client with anti-blocking measures."""
    
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    ]
    
    def __init__(self, delay: Optional[float] = None):
        self.delay = delay or settings.REQUEST_DELAY
        self._last_request_time = 0
        
    def _get_headers(self, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Generate headers with random user agent."""
        headers = {
            "User-Agent": random.choice(self.USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "DNT": "1",
            "Connection": "keep-alive",
        }
        
        if extra_headers:
            headers.update(extra_headers)
        
        return headers
    
    def _apply_delay(self):
        """Apply delay between requests."""
        if self.delay > 0:
            elapsed = time.time() - self._last_request_time
            if elapsed < self.delay:
                time.sleep(self.delay - elapsed + random.uniform(0.1, 0.5))
            self._last_request_time = time.time()
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def get(self, url: str, headers: Optional[Dict[str, str]] = None, 
            follow_redirects: bool = True, timeout: float = 30.0) -> httpx.Response:
        """Make GET request with retry logic."""
        self._apply_delay()
        
        merged_headers = self._get_headers(headers)
        
        with httpx.Client(follow_redirects=follow_redirects, timeout=timeout) as client:
            response = client.get(url, headers=merged_headers)
            response.raise_for_status()
            return response
    
    def get_with_github_auth(self, url: str, token: Optional[str] = None) -> httpx.Response:
        """Make authenticated GitHub API request."""
        headers = {}
        token = token or settings.GITHUB_TOKEN
        if token:
            headers["Authorization"] = f"token {token}"
        headers["Accept"] = "application/vnd.github.v3+json"
        
        return self.get(url, headers=headers)
