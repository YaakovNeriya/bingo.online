from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.domains.users.routes import router as users_router
from app.domains.products.routes import router as products_router
from app.domains.orders.routes import router as orders_router
from app.domains.admin.routes import router as admin_router

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    setup_exception_handlers(app)

    app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
    app.include_router(products_router, prefix=f"{settings.API_V1_STR}/products", tags=["products"])
    app.include_router(orders_router, prefix=f"{settings.API_V1_STR}/orders", tags=["orders"])
    app.include_router(admin_router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])

    return app
