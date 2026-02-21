
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path (one level up from scripts/)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def update_schema():
    print("Connecting to database...")
    print(f"URL: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("Checking if column 'technical_analysis' exists...")
        result = db.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name='articles' AND column_name='technical_analysis';"
        ))
        
        if result.fetchone():
            print("Column 'technical_analysis' already exists.")
        else:
            print("Adding column 'technical_analysis'...")
            db.execute(text("ALTER TABLE articles ADD COLUMN technical_analysis TEXT;"))
            db.commit()
            print("Column added successfully.")
            
    except Exception as e:
        print(f"Error updating schema: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_schema()
