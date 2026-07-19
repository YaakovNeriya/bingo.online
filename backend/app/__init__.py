from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.scheduler import start_scheduler, stop_scheduler
from app.domains.users.routes import router as users_router
from app.domains.products.routes import router as products_router
from app.domains.orders.routes import router as orders_router
from app.domains.admin.routes import router as admin_router
from app.domains.share.routes import router as share_router
from app.core.rate_limit import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware

from app.core.http_client import http_client
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background cron job scheduler on startup
    start_scheduler()
    yield
    # Stop the scheduler cleanly on shutdown
    stop_scheduler()
    # Close httpx client connection pool
    await http_client.aclose()
    
    # Close MySQL connections gracefully to prevent zombie connections
    from app.db.database import engine
    await engine.dispose()

import sentry_sdk

sentry_sdk.init(
    dsn="https://761742710e0e92ac03ddef77adc2fc23@o4511698789728256.ingest.de.sentry.io/4511699057836112",
    # Add data like request headers and IP for users,
    send_default_pii=False,
    # Set traces_sample_rate to 1.0 to capture 100% of transactions for tracing.
    traces_sample_rate=1.0,
)

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    setup_exception_handlers(app)

    app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
    app.include_router(products_router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
    app.include_router(orders_router, prefix=f"{settings.API_V1_STR}/orders", tags=["orders"])
    app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
    app.include_router(share_router, prefix=f"{settings.API_V1_STR}/share", tags=["share"])

    @app.get(f"{settings.API_V1_STR}/health", tags=["health"])
    async def health_check(db: AsyncSession = Depends(get_db)):
        try:
            # Deep health check: verify DB connectivity
            await db.execute(text("SELECT 1"))
            return {"status": "ok", "db": "ok"}
        except Exception as e:
            import logging
            logging.error(f"Health check failed: {e}")
            raise HTTPException(status_code=503, detail="Service Unavailable")

    return app
