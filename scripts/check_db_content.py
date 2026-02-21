
import sys
import os
from sqlalchemy import create_engine, text

# Add project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def check_db():
    print(f"Connecting to {settings.DATABASE_URL}...")
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Count articles
            result = conn.execute(text("SELECT count(*) FROM articles"))
            count = result.scalar()
            print(f"Total articles in DB: {count}")
            
            if count > 0:
                print("\nLast 3 articles analysis comparison:")
                rows = conn.execute(text("SELECT title, technical_analysis FROM articles ORDER BY scraped_at DESC LIMIT 3"))
                for i, row in enumerate(rows):
                    print(f"\n[{i+1}] {row[0]}")
                    print(f"ANALYSIS: {row[1]}")
            else:
                print("No articles found.")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
