"""Main application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.db.database import init_db
from app.api import router
from app.middleware import CacheMiddleware, cache_manager, limiter, custom_rate_limit_handler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting up Tech Trend Tracker...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    
    # Initialize Redis cache
    try:
        await cache_manager.connect()
        logger.info("Redis cache initialized successfully")
    except Exception as e:
        logger.error(f"Redis initialization error: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Tech Trend Tracker...")
    try:
        await cache_manager.disconnect()
    except Exception as e:
        logger.error(f"Redis disconnect error: {e}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    Tech Trend Tracker - Движок анализа технологических трендов и новостей.
    
    ## Features
    
    * **Articles**: Tech news from TechCrunch and other sources with ML sentiment analysis
    * **Repositories**: GitHub trending repositories with popularity tracking
    * **Trends**: Technology trend analysis with ML-powered categorization
    * **Dashboard**: Overview statistics with beautiful visualizations
    * **Real-time Updates**: WebSocket support for live data
    * **Caching**: Redis-powered caching for improved performance
    * **Background Tasks**: Celery-based periodic data collection
    
    ## Data Sources
    
    * TechCrunch - Latest tech news and articles
    * GitHub Trending - Popular repositories
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add cache middleware
app.add_middleware(CacheMiddleware)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

# Include API routes
app.include_router(router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
