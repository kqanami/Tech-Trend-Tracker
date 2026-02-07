"""Machine Learning analyzer for sentiment and categorization."""
import logging
import re
from typing import Dict, List, Optional
from textblob import TextBlob

logger = logging.getLogger(__name__)


class MLAnalyzer:
    """ML-based text analysis for articles and trends."""
    
    # Technology categories and keywords
    TECH_CATEGORIES = {
        'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'neural network', 
                  'deep learning', 'nlp', 'computer vision', 'gpt', 'llm', 'transformer'],
        'Web Development': ['react', 'vue', 'angular', 'javascript', 'typescript', 'nextjs',
                           'nodejs', 'frontend', 'backend', 'fullstack', 'web', 'html', 'css'],
        'DevOps': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'github actions', 'terraform',
                  'ansible', 'cloud', 'aws', 'azure', 'gcp', 'deployment'],
        'Mobile': ['ios', 'android', 'flutter', 'react native', 'swift', 'kotlin', 
                  'mobile app', 'app development'],
        'Data Science': ['data', 'analytics', 'visualization', 'pandas', 'numpy', 'jupyter',
                        'statistics', 'big data', 'etl', 'data engineering'],
        'Blockchain': ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3', 'nft', 
                      'smart contract', 'defi'],
        'Security': ['security', 'cybersecurity', 'encryption', 'authentication', 
                    'authorization', 'vulnerability', 'penetration testing', 'infosec'],
        'Backend': ['database', 'api', 'rest', 'graphql', 'microservices', 'server',
                   'postgresql', 'mongodb', 'redis', 'kafka'],
        'Programming Languages': ['python', 'java', 'go', 'rust', 'c++', 'c#', 'ruby',
                                 'php', 'scala', 'elixir'],
    }
    
    def analyze_sentiment(self, text: str) -> float:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Sentiment score from -1.0 (negative) to 1.0 (positive)
        """
        try:
            if not text:
                return 0.0
            
            blob = TextBlob(text)
            sentiment = blob.sentiment.polarity
            
            # Normalize to -1 to 1 range
            return round(sentiment, 3)
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return 0.0
    
    def categorize_text(self, text: str, title: str = "") -> str:
        """
        Categorize text based on technology keywords.
        
        Args:
            text: Text content to categorize
            title: Title of the article (weighted more heavily)
            
        Returns:
            Category name or 'General' if no match
        """
        try:
            # Combine title and text, weight title more
            combined_text = f"{title} {title} {text}".lower()
            
            # Count matches for each category
            category_scores = {}
            for category, keywords in self.TECH_CATEGORIES.items():
                score = sum(
                    combined_text.count(keyword.lower()) 
                    for keyword in keywords
                )
                if score > 0:
                    category_scores[category] = score
            
            if not category_scores:
                return 'General'
            
            # Return category with highest score
            return max(category_scores.items(), key=lambda x: x[1])[0]
        except Exception as e:
            logger.error(f"Categorization error: {e}")
            return 'General'
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """
        Extract important keywords from text.
        
        Args:
            text: Text to extract keywords from
            top_n: Number of top keywords to return
            
        Returns:
            List of keywords
        """
        try:
            if not text:
                return []
            
            # Simple keyword extraction using word frequency
            # Remove common words
            common_words = {
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
            }
            
            # Clean and tokenize
            text = text.lower()
            words = re.findall(r'\b[a-z]{3,}\b', text)
            
            # Filter and count
            word_freq = {}
            for word in words:
                if word not in common_words:
                    word_freq[word] = word_freq.get(word, 0) + 1
            
            # Get top N
            sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            return [word for word, _ in sorted_words[:top_n]]
        except Exception as e:
            logger.error(f"Keyword extraction error: {e}")
            return []
    
    def predict_trend_score(self, mention_count: int, growth_rate: float, 
                           sentiment: float = 0.0) -> float:
        """
        Predict trend score based on multiple factors.
        
        Args:
            mention_count: Number of mentions
            growth_rate: Growth rate (0-100)
            sentiment: Average sentiment (-1 to 1)
            
        Returns:
            Trend score (0-100)
        """
        try:
            # Weighted formula
            # 50% mention count, 30% growth rate, 20% sentiment
            normalized_mentions = min(mention_count / 100, 1.0) * 50
            normalized_growth = min(growth_rate / 100, 1.0) * 30
            normalized_sentiment = ((sentiment + 1) / 2) * 20  # Convert -1,1 to 0,20
            
            score = normalized_mentions + normalized_growth + normalized_sentiment
            return round(min(score, 100), 2)
        except Exception as e:
            logger.error(f"Trend prediction error: {e}")
            return 0.0

    def analyze_article(self, article_data: Dict) -> Dict:
        """
        Comprehensive analysis of an article.
        
        Args:
            article_data: Article data dictionary
            
        Returns:
            Dictionary with analysis results
        """
        title = article_data.get('title', '')
        summary = article_data.get('summary', '')
        content = article_data.get('content', '')
        
        text = f"{summary} {content}"
        
        return {
            'sentiment_score': self.analyze_sentiment(text),
            'category': self.categorize_text(text, title),
            'keywords': self.extract_keywords(text),
        }
