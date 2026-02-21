
import sys
import os
import requests
import json

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# API URL (default to localhost for host execution, but can verify manually)
API_URL = "http://localhost:8000/api/v1/scrape"
if os.getenv("DATABASE_URL"):
     API_URL = "http://tech_trend_app:8000/api/v1/scrape"

def scrape_more():
    print("🚀 Triggering extended scraping (50 items)...")
    
    # 1. Scrape many items
    payload = {
        "source": "all", 
        "limit": 50 
    }
    
    try:
        print(f"Sending request to {API_URL}...")
        response = requests.post(API_URL, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Response: {json.dumps(data, indent=2)}")
            print(f"Created {data.get('articles_created', 0)} new articles.")
            print(f"Created {data.get('repos_created', 0)} new repos.")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    scrape_more()
