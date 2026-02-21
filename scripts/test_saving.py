
import sys
import os
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.data_processor import DataProcessor
from app.models.article import Article

def test_saving():
    print(f"Connecting to DB: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        processor = DataProcessor(db)
        
        article_data = {
            "title": "Test Article",
            "url": "http://example.com/test",
            "source": "test",
            "summary": "This is a summary of the test article.",
            "content": "Full content of the test article.",
            "published_at": datetime.now(),
            "category": "Test",
            "author": "Tester"
        }
        
        print("Attempting to process and save article...")
        result = processor.process_article(article_data)
        
        if result:
            print(f"✅ Article saved successfully! ID: {result.id}")
        else:
            print("❌ Article returned None (failed to save).")
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_saving()
