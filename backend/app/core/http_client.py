import httpx

# Global httpx AsyncClient instance to be used across the application
# This allows connection pooling to be shared, drastically improving performance.
# It should be initialized and closed in the FastAPI lifespan events.
http_client = httpx.AsyncClient(timeout=10.0)
