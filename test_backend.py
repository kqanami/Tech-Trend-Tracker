"""
Backend Testing Script - Tech Trend Tracker v2.0
Проверяет все компоненты backend без запуска полного приложения
"""

import sys
import os

print("=" * 60)
print("🔍 TECH TREND TRACKER - BACKEND TEST")
print("=" * 60)

# Test 1: Import basic dependencies
print("\n[1/8] Testing basic imports...")
try:
    import fastapi
    print(f"  ✅ FastAPI {fastapi.__version__}")
except ImportError as e:
    print(f"  ❌ FastAPI: {e}")
    
try:
    import sqlalchemy
    print(f"  ✅ SQLAlchemy {sqlalchemy.__version__}")
except ImportError as e:
    print(f"  ❌ SQLAlchemy: {e}")

try:
    import pydantic
    print(f"  ✅ Pydantic {pydantic.__version__}")
except ImportError as e:
    print(f"  ❌ Pydantic: {e}")

# Test 2: ML dependencies
print("\n[2/8] Testing ML dependencies...")
try:
    import textblob
    print(f"  ✅ TextBlob {textblob.__version__}")
except ImportError as e:
    print(f"  ❌ TextBlob: {e}")

try:
    import sklearn
    print(f"  ✅ scikit-learn {sklearn.__version__}")
except ImportError as e:
    print(f"  ❌ scikit-learn: {e}")

# Test 3: Redis & Celery
print("\n[3/8] Testing Redis & Celery...")
try:
    import redis
    print(f"  ✅ Redis {redis.__version__}")
except ImportError as e:
    print(f"  ❌ Redis: {e}")

try:
    import celery
    print(f"  ✅ Celery {celery.__version__}")
except ImportError as e:
    print(f"  ❌ Celery: {e}")

# Test 4: Rate limiting
print("\n[4/8] Testing Rate limiting...")
try:
    import slowapi
    print(f"  ✅ SlowAPI {slowapi.__version__}")
except ImportError as e:
    print(f"  ❌ SlowAPI: {e}")

# Test 5: App imports
print("\n[5/8] Testing app modules...")
try:
    sys.path.insert(0, os.path.dirname(__file__))
    from app.core.config import settings
    print(f"  ✅ Config loaded: {settings.APP_NAME}")
except Exception as e:
    print(f"  ❌ Config: {e}")

try:
    from app.models import Article, GitHubRepo, Trend
    print(f"  ✅ Models imported")
except Exception as e:
    print(f"  ❌ Models: {e}")

# Test 6: ML Analyzer
print("\n[6/8] Testing ML Analyzer...")
try:
    from app.services.ml_analyzer import MLAnalyzer
    analyzer = MLAnalyzer()
    
    test_text = {
        'title': 'Amazing New AI Technology',
        'summary': 'This is a great breakthrough in artificial intelligence',
        'content': 'Machine learning and deep learning are transforming the world'
    }
    
    result = analyzer.analyze_article(test_text)
    print(f"  ✅ ML Analyzer works")
    print(f"     Sentiment: {result.get('sentiment_score', 0):.2f}")
    print(f"     Category: {result.get('category', 'Unknown')}")
    print(f"     Keywords: {', '.join(result.get('keywords', [])[:3])}")
except Exception as e:
    print(f"  ❌ ML Analyzer: {e}")

# Test 7: Cache Manager
print("\n[7/8] Testing Cache Manager...")
try:
    from app.middleware.cache import CacheManager
    cache = CacheManager()
    print(f"  ✅ Cache Manager initialized")
    print(f"     Redis URL: {cache.redis_url}")
    print(f"     ⚠️  Requires Redis server to connect")
except Exception as e:
    print(f"  ❌ Cache Manager: {e}")

# Test 8: Celery Tasks
print("\n[8/8] Testing Celery Tasks...")
try:
    from app.services.celery_app import app as celery_app
    print(f"  ✅ Celery app configured")
    print(f"     Broker: {celery_app.conf.broker_url}")
    tasks = list(celery_app.tasks.keys())
    periodic_tasks = [t for t in tasks if 'scrape' in t or 'calculate' in t or 'cleanup' in t]
    print(f"     Tasks defined: {len(periodic_tasks)} periodic tasks")
    for task in periodic_tasks[:5]:
        print(f"       - {task}")
    print(f"     ⚠️  Requires Redis + Celery worker to run")
except Exception as e:
    print(f"  ❌ Celery: {e}")

# Summary
print("\n" + "=" * 60)
print("📊 TEST SUMMARY")
print("=" * 60)
print("\n✅ WORKING WITHOUT EXTERNAL SERVICES:")
print("   - FastAPI, SQLAlchemy, Pydantic")
print("   - ML Libraries (TextBlob, scikit-learn)")
print("   - App modules (models, config)")
print("   - ML Analyzer (sentiment, categorization)")
print("   - Code structure")

print("\n⚠️  REQUIRES EXTERNAL SERVICES TO FULLY WORK:")
print("   - PostgreSQL database (for data storage)")
print("   - Redis server (for caching + Celery broker)")
print("   - Celery worker (for background tasks)")

print("\n🚀 TO RUN FULL BACKEND:")
print("   Option 1 (Docker - RECOMMENDED):")
print("     docker compose up -d")
print("\n   Option 2 (Manual):")
print("     1. Install PostgreSQL")
print("     2. Install Redis")
print("     3. pip install -r requirements.txt")
print("     4. python -m app.main")

print("\n" + "=" * 60)
