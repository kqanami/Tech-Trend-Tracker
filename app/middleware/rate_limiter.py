"""Rate limiting middleware using SlowAPI."""
import logging
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger(__name__)

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",  # Can be changed to redis:// for distributed systems
)

# Custom rate limit handler
async def custom_rate_limit_handler(request, exc):
    """Custom handler for rate limit exceeded."""
    logger.warning(f"Rate limit exceeded for IP: {get_remote_address(request)}")
    return _rate_limit_exceeded_handler(request, exc)
