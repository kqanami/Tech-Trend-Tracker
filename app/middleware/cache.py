"""Redis cache middleware for API endpoints."""
import json
import hashlib
import logging
from typing import Optional, Callable
from functools import wraps

import redis.asyncio as aioredis
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheManager:
    """Redis cache manager."""
    
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.default_ttl = 300  # 5 minutes
    
    async def connect(self):
        """Connect to Redis."""
        try:
            self.redis_client = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis cache connected")
        except Exception as e:
            logger.error(f"Redis connection error: {e}")
            self.redis_client = None
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis cache disconnected")
    
    def _generate_key(self, request: Request) -> str:
        """Generate cache key from request."""
        # Create unique key from path and query params
        key_data = f"{request.url.path}:{str(sorted(request.query_params.items()))}"
        return f"cache:{hashlib.md5(key_data.encode()).hexdigest()}"
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from cache."""
        if not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            return value
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: str, ttl: int = None):
        """Set value in cache."""
        if not self.redis_client:
            return
        
        try:
            ttl = ttl or self.default_ttl
            await self.redis_client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    async def delete(self, pattern: str):
        """Delete keys matching pattern."""
        if not self.redis_client:
            return
        
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
    
    async def clear_all(self):
        """Clear all cache."""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.flushdb()
            logger.info("Cache cleared")
        except Exception as e:
            logger.error(f"Cache clear error: {e}")


# Global cache manager instance
cache_manager = CacheManager()


class CacheMiddleware(BaseHTTPMiddleware):
    """Cache middleware for GET requests."""
    
    # Paths to cache (only cacheable endpoints)
    CACHEABLE_PATHS = [
        '/api/v1/articles',
        '/api/v1/repos',
        '/api/v1/trends',
        '/api/v1/dashboard/stats',
    ]
    
    # TTL for different endpoints (seconds)
    TTL_CONFIG = {
        '/api/v1/articles': 300,  # 5 minutes
        '/api/v1/repos': 300,
        '/api/v1/trends': 600,  # 10 minutes
        '/api/v1/dashboard/stats': 120,  # 2 minutes
    }
    
    async def dispatch(self, request: Request, call_next: Callable):
        """Process request with caching."""
        # Only cache GET requests for specific paths
        if request.method != "GET":
            return await call_next(request)
        
        # Check if path should be cached
        should_cache = any(
            request.url.path.startswith(path) 
            for path in self.CACHEABLE_PATHS
        )
        
        if not should_cache:
            return await call_next(request)
        
        # Generate cache key
        cache_key = cache_manager._generate_key(request)
        
        # Try to get from cache
        cached_response = await cache_manager.get(cache_key)
        if cached_response:
            logger.debug(f"Cache hit: {request.url.path}")
            return Response(
                content=cached_response,
                media_type="application/json",
                headers={"X-Cache": "HIT"}
            )
        
        # Process request
        response = await call_next(request)
        
        # Cache successful responses
        if response.status_code == 200:
            # Read response body
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            # Determine TTL
            ttl = next(
                (v for k, v in self.TTL_CONFIG.items() if request.url.path.startswith(k)),
                cache_manager.default_ttl
            )
            
            # Store in cache
            await cache_manager.set(cache_key, body.decode(), ttl)
            
            # Return new response
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type
            )
        
        return response


def cache_invalidate(pattern: str = "*"):
    """
    Decorator to invalidate cache after function execution.
    
    Usage:
        @cache_invalidate("cache:articles:*")
        def create_article(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            await cache_manager.delete(pattern)
            return result
        return wrapper
    return decorator
