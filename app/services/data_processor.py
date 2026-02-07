"""Data processor for cleaning and normalizing scraped data."""
import logging
import json
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.article import Article
from app.models.github_repo import GitHubRepo
from app.models.trend import Trend
from app.models.tag import Tag
from app.utils.text_processor import TextProcessor

logger = logging.getLogger(__name__)


class DataProcessor:
    """Process and normalize scraped data."""
    
    def __init__(self, db: Session):
        self.db = db
        self.text_processor = TextProcessor()
        from app.services.ml_analyzer import MLAnalyzer
        self.ml_analyzer = MLAnalyzer()
    
    def process_article(self, article_data: Dict) -> Optional[Article]:
        """Process and save a single article."""
        try:
            existing = self.db.query(Article).filter(
                Article.url == article_data['url']
            ).first()
            
            if existing:
                logger.debug(f"Article already exists: {article_data['url']}")
                return existing
            
            title = self.text_processor.normalize_text(article_data.get('title'))
            summary = self.text_processor.normalize_text(article_data.get('summary'), max_length=1000)
            
            # ML Analysis
            ml_results = self.ml_analyzer.analyze_article({
                'title': title,
                'summary': summary,
                'content': article_data.get('content', '')
            })
            
            tag_names = self.text_processor.extract_tags(f"{title} {summary}")
            # Add ML-extracted keywords as tags
            tag_names.extend(ml_results.get('keywords', [])[:5])
            tag_names = list(set(tag_names))  # Remove duplicates
            
            # Use ML category if article category not provided
            category = article_data.get('category') or ml_results.get('category', 'General')
            
            article = Article(
                title=title,
                url=article_data['url'],
                source=article_data.get('source', 'unknown'),
                author=article_data.get('author'),
                summary=summary,
                content=article_data.get('content'),
                published_at=article_data.get('published_at'),
                category=category,
                image_url=article_data.get('image_url'),
                language=article_data.get('language', 'en'),
                sentiment_score=ml_results.get('sentiment_score', 0.0),
                is_processed=True
            )
            
            for tag_name in tag_names:
                tag = self._get_or_create_tag(tag_name)
                article.tags.append(tag)
                tag.usage_count += 1
            
            self.db.add(article)
            self.db.commit()
            self.db.refresh(article)
            
            logger.info(f"Created article: {article.title[:50]}...")
            return article
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing article: {e}")
            return None
    
    def process_github_repo(self, repo_data: Dict) -> Optional[GitHubRepo]:
        """Process and save a single GitHub repository."""
        try:
            existing = self.db.query(GitHubRepo).filter(
                GitHubRepo.full_name == repo_data['full_name']
            ).first()
            
            if existing:
                existing.stars = repo_data.get('stars', existing.stars)
                existing.forks = repo_data.get('forks', existing.forks)
                existing.stars_today = repo_data.get('stars_today', 0)
                existing.stars_week = repo_data.get('stars_week', 0)
                existing.stars_month = repo_data.get('stars_month', 0)
                existing.trending_score = repo_data.get('trending_score', 0)
                existing.is_processed = True
                
                if not existing.category:
                    text = f"{existing.description or ''} {existing.language or ''}"
                    try:
                        topics = json.loads(existing.topics) if existing.topics else []
                        text += ' ' + ' '.join(topics)
                    except:
                        pass
                    existing.category = self.text_processor.categorize_tech(text)
                
                self.db.commit()
                self.db.refresh(existing)
                return existing
            
            text = f"{repo_data.get('description', '')} {repo_data.get('language', '')}"
            try:
                topics = json.loads(repo_data.get('topics', '[]'))
                text += ' ' + ' '.join(topics)
            except:
                pass
            
            repo = GitHubRepo(
                repo_id=repo_data.get('repo_id'),
                name=repo_data['name'],
                full_name=repo_data['full_name'],
                owner=repo_data['owner'],
                url=repo_data['url'],
                description=self.text_processor.normalize_text(repo_data.get('description'), max_length=500),
                language=repo_data.get('language'),
                topics=repo_data.get('topics'),
                stars=repo_data.get('stars', 0),
                forks=repo_data.get('forks', 0),
                open_issues=repo_data.get('open_issues', 0),
                watchers=repo_data.get('watchers', 0),
                stars_today=repo_data.get('stars_today', 0),
                stars_week=repo_data.get('stars_week', 0),
                stars_month=repo_data.get('stars_month', 0),
                trending_score=repo_data.get('trending_score', 0),
                created_at=repo_data.get('created_at'),
                updated_at=repo_data.get('updated_at'),
                pushed_at=repo_data.get('pushed_at'),
                license=repo_data.get('license'),
                is_fork=repo_data.get('is_fork', False),
                is_archived=repo_data.get('is_archived', False),
                is_processed=True,
                category=self.text_processor.categorize_tech(text)
            )
            
            self.db.add(repo)
            self.db.commit()
            self.db.refresh(repo)
            
            logger.info(f"Created repo: {repo.full_name}")
            return repo
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing GitHub repo: {e}")
            return None
    
    def _get_or_create_tag(self, name: str) -> Tag:
        """Get existing tag or create new one."""
        name = name.lower().strip()
        slug = self.text_processor.slugify(name)
        
        tag = self.db.query(Tag).filter(Tag.slug == slug).first()
        
        if not tag:
            category = self._categorize_tag(name)
            tag = Tag(name=name, slug=slug, category=category)
            self.db.add(tag)
            self.db.flush()
        
        return tag
    
    def _categorize_tag(self, tag_name: str) -> str:
        """Categorize a tag."""
        languages = {'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'cpp', 'csharp', 'ruby', 'php'}
        frameworks = {'react', 'vue', 'angular', 'django', 'flask', 'fastapi', 'spring', 'express'}
        
        if tag_name in languages:
            return "language"
        elif tag_name in frameworks:
            return "framework"
        else:
            return "technology"
    
    def calculate_trends(self) -> List[Trend]:
        """Calculate trending technologies based on articles and repos."""
        from sqlalchemy import func
        
        trends = []
        
        try:
            # Get tag counts from articles
            tag_counts = self.db.query(
                Tag.name,
                Tag.category,
                func.count(Article.id).label('article_count')
            ).join(Tag.articles).group_by(Tag.id).all()
            
            # Get language counts from repos
            language_counts = self.db.query(
                GitHubRepo.language,
                func.count(GitHubRepo.id).label('repo_count'),
                func.sum(GitHubRepo.trending_score).label('total_score')
            ).filter(GitHubRepo.language.isnot(None)).group_by(GitHubRepo.language).all()
            
            # Process tags as trends
            for tag_name, category, article_count in tag_counts:
                trend = self._update_trend(
                    name=tag_name,
                    category=category or "technology",
                    article_count=article_count,
                    repo_count=0
                )
                if trend:
                    trends.append(trend)
            
            # Process languages as trends
            for language, repo_count, total_score in language_counts:
                if language:
                    trend = self._update_trend(
                        name=language,
                        category="programming_language",
                        article_count=0,
                        repo_count=repo_count,
                        score=total_score or 0
                    )
                    if trend:
                        trends.append(trend)
            
            self.db.commit()
            logger.info(f"Calculated {len(trends)} trends")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error calculating trends: {e}")
        
        return trends
    
    def _update_trend(self, name: str, category: str, 
                     article_count: int = 0, repo_count: int = 0,
                     score: float = 0) -> Optional[Trend]:
        """Update or create a trend."""
        try:
            slug = self.text_processor.slugify(name)
            
            trend = self.db.query(Trend).filter(Trend.slug == slug).first()
            
            if trend:
                trend.article_count += article_count
                trend.repo_count += repo_count
                trend.mention_count = trend.article_count + trend.repo_count
                trend.popularity_score = min(100, trend.mention_count * 2)
                trend.growth_score = min(100, score / 10)
                trend.overall_score = (trend.popularity_score + trend.growth_score) / 2
                trend.calculated_at = datetime.utcnow()
            else:
                mention_count = article_count + repo_count
                popularity = min(100, mention_count * 2)
                growth = min(100, score / 10)
                
                trend = Trend(
                    name=name,
                    slug=slug,
                    category=category,
                    mention_count=mention_count,
                    article_count=article_count,
                    repo_count=repo_count,
                    popularity_score=popularity,
                    growth_score=growth,
                    overall_score=(popularity + growth) / 2,
                    calculated_at=datetime.utcnow()
                )
                self.db.add(trend)
            
            return trend
            
        except Exception as e:
            logger.error(f"Error updating trend {name}: {e}")
            return None
    
    def process_batch(self, articles: List[Dict] = None, 
                     repos: List[Dict] = None) -> Dict:
        """Process a batch of articles and repos."""
        results = {
            "articles_created": 0,
            "repos_created": 0,
            "errors": []
        }
        
        if articles:
            for article_data in articles:
                try:
                    result = self.process_article(article_data)
                    if result:
                        results["articles_created"] += 1
                except Exception as e:
                    results["errors"].append(f"Article error: {str(e)}")
        
        if repos:
            for repo_data in repos:
                try:
                    result = self.process_github_repo(repo_data)
                    if result:
                        results["repos_created"] += 1
                except Exception as e:
                    results["errors"].append(f"Repo error: {str(e)}")
        
        self.calculate_trends()
        
        return results
