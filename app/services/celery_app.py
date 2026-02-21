"""Celery application configuration and tasks."""
import logging
from datetime import timedelta
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "tech_trend_tracker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    'scrape-hackernews-every-15-mins': {
        'task': 'app.services.celery_app.scrape_hackernews_task',
        'schedule': timedelta(minutes=15),
        'options': {'queue': 'scraping'}
    },
    'scrape-arxiv-every-15-mins': {
        'task': 'app.services.celery_app.scrape_arxiv_task',
        'schedule': timedelta(minutes=15),
        'options': {'queue': 'scraping'}
    },
    'scrape-techcrunch-every-15-mins': {
        'task': 'app.services.celery_app.scrape_techcrunch_task',
        'schedule': timedelta(minutes=15),
        'options': {'queue': 'scraping'}
    },
    'scrape-github-every-15-mins': {
        'task': 'app.services.celery_app.scrape_github_task',
        'schedule': timedelta(minutes=15),
        'options': {'queue': 'scraping'}
    },
    'calculate-trends-every-15-mins': {
        'task': 'app.services.celery_app.calculate_trends_task',
        'schedule': timedelta(minutes=15),
        'options': {'queue': 'processing'}
    },
    'cleanup-old-data-daily': {
        'task': 'app.services.celery_app.cleanup_old_data_task',
        'schedule': crontab(hour=3, minute=0),  # 3 AM daily
        'options': {'queue': 'maintenance'}
    },
}

@celery_app.task(name='app.services.celery_app.scrape_hackernews_task', bind=True)
def scrape_hackernews_task(self):
    """Scrape HackerNews stories."""
    try:
        from app.db.database import SessionLocal
        from app.services.hackernews_scraper import HackerNewsScraper
        from app.services.data_processor import DataProcessor
        
        db = SessionLocal()
        try:
            logger.info("Starting HackerNews scraping task...")
            scraper = HackerNewsScraper()
            processor = DataProcessor(db)
            
            # Scrape top 30 stories
            articles = scraper.scrape_latest(limit=30)
            articles_created = 0
            
            for article_data in articles:
                result = processor.process_article(article_data)
                if result:
                    articles_created += 1
            
            db.commit()
            logger.info(f"HackerNews scraping completed: {articles_created} articles")
            return {'status': 'success', 'articles_created': articles_created}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"HackerNews scraping error: {e}")
        raise

@celery_app.task(name='app.services.celery_app.scrape_arxiv_task', bind=True)
def scrape_arxiv_task(self):
    """Scrape ArXiv papers."""
    try:
        from app.db.database import SessionLocal
        from app.services.arxiv_scraper import ArXivScraper
        from app.services.data_processor import DataProcessor
        
        db = SessionLocal()
        try:
            logger.info("Starting ArXiv scraping task...")
            scraper = ArXivScraper()
            processor = DataProcessor(db)
            
            # Scrape latest 20 papers
            articles = scraper.scrape_latest(limit=20)
            articles_created = 0
            
            for article_data in articles:
                result = processor.process_article(article_data)
                if result:
                    articles_created += 1
            
            db.commit()
            logger.info(f"ArXiv scraping completed: {articles_created} articles")
            return {'status': 'success', 'articles_created': articles_created}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"ArXiv scraping error: {e}")
        raise


@celery_app.task(name='app.services.celery_app.scrape_techcrunch_task', bind=True)
def scrape_techcrunch_task(self):
    """Scrape TechCrunch articles."""
    try:
        from app.db.database import SessionLocal
        from app.services.techcrunch_scraper import TechCrunchScraper
        from app.services.data_processor import DataProcessor
        
        db = SessionLocal()
        try:
            logger.info("Starting TechCrunch scraping task...")
            scraper = TechCrunchScraper()
            processor = DataProcessor(db)
            
            # Only get recent articles (last 7 days) to avoid duplicates
            articles = scraper.scrape_all_categories(limit_per_category=10, only_recent=True, days_back=7)
            articles_created = 0
            
            logger.info(f"📊 Scraped {len(articles)} articles, checking for new ones...")
            
            skipped_count = 0
            for article_data in articles:
                result = processor.process_article(article_data)
                # Only count if result is not None (None means article already exists)
                if result is not None:
                    articles_created += 1
                else:
                    skipped_count += 1
            
            db.commit()
            logger.info(f"✅ TechCrunch scraping completed: {articles_created} NEW articles created, {skipped_count} duplicates skipped")
            return {'status': 'success', 'articles_created': articles_created}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"TechCrunch scraping error: {e}")
        raise


@celery_app.task(name='app.services.celery_app.scrape_github_task', bind=True)
def scrape_github_task(self):
    """Scrape GitHub trending repositories."""
    try:
        from app.db.database import SessionLocal
        from app.services.github_scraper import GitHubScraper
        from app.services.data_processor import DataProcessor
        
        db = SessionLocal()
        try:
            logger.info("Starting GitHub scraping task...")
            scraper = GitHubScraper()
            processor = DataProcessor(db)
            
            repos = scraper.scrape_all_languages(limit_per_lang=5)
            repos_created = 0
            
            for repo_data in repos:
                result = processor.process_github_repo(repo_data)
                if result:
                    repos_created += 1
            
            db.commit()
            logger.info(f"GitHub scraping completed: {repos_created} repos")
            return {'status': 'success', 'repos_created': repos_created}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"GitHub scraping error: {e}")
        raise


@celery_app.task(name='app.services.celery_app.calculate_trends_task', bind=True)
def calculate_trends_task(self):
    """Calculate technology trends."""
    try:
        from app.db.database import SessionLocal
        from app.services.data_processor import DataProcessor
        
        db = SessionLocal()
        try:
            logger.info("Calculating trends...")
            processor = DataProcessor(db)
            processor.calculate_trends()
            db.commit()
            logger.info("Trends calculation completed")
            return {'status': 'success'}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Trends calculation error: {e}")
        raise


@celery_app.task(name='app.services.celery_app.cleanup_old_data_task', bind=True)
def cleanup_old_data_task(self):
    """Cleanup old data (articles older than 90 days)."""
    try:
        from datetime import datetime, timedelta
        from app.db.database import SessionLocal
        from app.models.article import Article
        
        db = SessionLocal()
        try:
            logger.info("Starting data cleanup...")
            cutoff_date = datetime.utcnow() - timedelta(days=90)
            
            deleted_count = db.query(Article).filter(
                Article.scraped_at < cutoff_date
            ).delete(synchronize_session=False)
            
            db.commit()
            logger.info(f"Data cleanup completed: {deleted_count} old articles removed")
            return {'status': 'success', 'deleted_count': deleted_count}
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Data cleanup error: {e}")
        raise
