
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.models.article import Article
from app.services.ml_analyzer import MLAnalyzer
from app.utils.text_processor import TextProcessor

def regenerate_analysis():
    print(f"Connecting to DB: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    analyzer = MLAnalyzer()
    
    try:
        articles = db.query(Article).all()
        print(f"Found {len(articles)} articles. Regenerating analysis...")
        
        count = 0
        for article in articles:
            # Re-run analysis
            print(f"[{count+1}/{len(articles)}] Updating: {article.title[:30]}...")
            
            # Prepare data
            data = {
                'title': article.title,
                'summary': article.summary,
                'content': article.content or ''
            }
            
            # Generate new analysis
            results = analyzer.analyze_article(data)
            
            # Update article
            article.technical_analysis = results['technical_analysis']
            article.sentiment_score = results['sentiment_score']
            
            count += 1
            
        db.commit()
        print(f"✅ Successfully updated {count} articles with new analysis.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    regenerate_analysis()
