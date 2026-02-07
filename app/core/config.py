"""Configuration settings for the application."""
import os
from typing import Optional


class Settings:
    """Application settings."""
    
    # Application
    APP_NAME: str = "Tech Trend Tracker"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://techuser:techpass@localhost:5432/techtrend"
    )
    
    # Redis
    REDIS_URL: str = os.getenv(
        "REDIS_URL",
        "redis://localhost:6379/0"
    )
    
    # Celery
    CELERY_BROKER_URL: str = os.getenv(
        "CELERY_BROKER_URL",
        "redis://localhost:6379/1"
    )
    CELERY_RESULT_BACKEND: str = os.getenv(
        "CELERY_RESULT_BACKEND",
        "redis://localhost:6379/2"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # GitHub API
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN")
    
    # Scraping
    REQUEST_DELAY: float = 1.5
    MAX_RETRIES: int = 3


settings = Settings()
