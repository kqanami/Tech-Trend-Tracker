
import sys
import os
import time
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path (Go up one level from scripts/)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database URL: Use env var if available (Docker), else localhost (Host)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://techuser:techpass@localhost:5432/techtrend")

# API URL: Try to reach the app container if getting from env, else localhost
if os.getenv("DATABASE_URL"):
    # We are likely in a container
    API_URL = "http://tech_trend_app:8000/api/v1/scrape"
else:
    API_URL = "http://localhost:8000/api/v1/scrape"

def fix_schema():
    print("🔧 Fixing database schema...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='articles' AND column_name='technical_analysis';"
            ))
            
            if result.fetchone():
                print("✅ Column 'technical_analysis' already exists.")
            else:
                print("➕ Adding column 'technical_analysis'...")
                connection.execute(text("ALTER TABLE articles ADD COLUMN technical_analysis TEXT;"))
                connection.commit()
                print("✅ Column added successfully.")
    except Exception as e:
        print(f"❌ Error fixing schema: {e}")
        return False
    return True

def trigger_scraping():
    print("\n🚀 Triggering news scraping...")
    headers = {"Content-Type": "application/json"}
    payload = {"source": "all", "limit": 10}
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        if response.status_code == 200:
            print("✅ Scraping triggered successfully!")
            print(f"Response: {response.json()}")
        else:
            print(f"⚠️ Failed to trigger scraping. Status: {response.status_code}")
            print(f"Response: {response.text}")
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Could not connect to API at {API_URL}.")
        print(f"Error: {e}")

def main():
    if fix_schema():
        # Wait a moment for DB to settle if changes were made
        time.sleep(2)
        trigger_scraping()
    else:
        print("\nSkipping scraping trigger due to schema error.")

if __name__ == "__main__":
    main()
