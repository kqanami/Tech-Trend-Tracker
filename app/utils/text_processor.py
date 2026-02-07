"""Text processing utilities for data normalization."""
import re
import html
from typing import List, Set, Optional
from datetime import datetime
from dateutil import parser as date_parser


class TextProcessor:
    """Text processing and normalization utilities."""
    
    TECH_KEYWORDS = {
        "python", "javascript", "typescript", "java", "go", "golang", "rust", "cpp", "csharp",
        "ruby", "php", "swift", "kotlin", "scala", "r", "dart",
        "react", "vue", "angular", "svelte", "nextjs", "django", "flask",
        "fastapi", "spring", "express", "tensorflow", "pytorch", "pandas",
        "ai", "artificial intelligence", "machine learning", "ml", "deep learning",
        "blockchain", "web3", "crypto", "cloud", "aws", "azure", "kubernetes",
        "docker", "devops", "serverless", "microservices", "api", "graphql",
        "database", "sql", "nosql", "mongodb", "postgresql", "redis",
        "ios", "android", "web", "mobile", "linux", "windows",
        "startup", "funding", "security", "open source", "github",
    }
    
    @staticmethod
    def clean_html(text: str) -> str:
        """Remove HTML tags and decode HTML entities."""
        if not text:
            return ""
        text = re.sub(r'<[^>]+>', ' ', text)
        text = html.unescape(text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    @staticmethod
    def normalize_text(text: str, max_length: Optional[int] = None) -> str:
        """Normalize text: clean, trim, optional truncate."""
        if not text:
            return ""
        
        text = TextProcessor.clean_html(text)
        text = re.sub(r'\s+', ' ', text)
        
        if max_length and len(text) > max_length:
            text = text[:max_length].rsplit(' ', 1)[0] + '...'
        
        return text.strip()
    
    @staticmethod
    def extract_tags(text: str) -> Set[str]:
        """Extract technology tags from text."""
        if not text:
            return set()
        
        text_lower = text.lower()
        found_tags = set()
        
        for keyword in TextProcessor.TECH_KEYWORDS:
            if keyword in text_lower:
                found_tags.add(keyword)
        
        return found_tags
    
    @staticmethod
    def parse_date(date_string: str) -> Optional[datetime]:
        """Parse date from various formats."""
        if not date_string:
            return None
        
        try:
            return date_parser.parse(date_string)
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug."""
        if not text:
            return ""
        
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'\s+', '-', text)
        text = re.sub(r'-+', '-', text)
        
        return text.strip('-')
    
    @staticmethod
    def categorize_tech(text: str) -> str:
        """Categorize technology based on text content."""
        if not text:
            return "Other"
        
        text_lower = text.lower()
        
        categories = {
            "AI/ML": ["ai", "artificial intelligence", "machine learning", "ml", 
                     "deep learning", "neural network", "nlp", "tensorflow", "pytorch"],
            "Web Development": ["web", "frontend", "backend", "react", "vue", "angular", "javascript"],
            "Mobile": ["mobile", "ios", "android", "swift", "kotlin", "flutter"],
            "DevOps": ["devops", "docker", "kubernetes", "ci/cd", "aws", "cloud"],
            "Data": ["data", "database", "sql", "big data", "analytics"],
            "Security": ["security", "cybersecurity", "privacy", "encryption"],
            "Blockchain": ["blockchain", "crypto", "web3", "bitcoin", "ethereum"],
        }
        
        scores = {}
        for category, keywords in categories.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score
        
        if scores:
            return max(scores, key=scores.get)
        
        return "Other"
