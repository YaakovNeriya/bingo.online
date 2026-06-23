from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.domains.products.models import ProductType, ProductModel, ColorSKU
from app.domains.products import schemas
from app.utils.cache import get_cache, set_cache

CACHE_KEY_CATALOG = "catalog_full"

async def get_full_catalog(db: AsyncSession) -> List[schemas.ProductTypeOut] | list:
    # 1. Check Redis Cache
    cached_catalog = await get_cache(CACHE_KEY_CATALOG)
    if cached_catalog:
        return cached_catalog
    
    # 2. Cache Miss - Query DB with Eager Loading to prevent N+1
    stmt = (
        select(ProductType)
        .options(
            selectinload(ProductType.product_models.and_(ProductModel.is_active == True))
            .selectinload(ProductModel.color_skus.and_(ColorSKU.is_active == True))
        )
    )
    result = await db.execute(stmt)
    product_types = result.scalars().all()
    
    # Convert to Pydantic representations for caching as JSON
    catalog_data = [schemas.ProductTypeOut.model_validate(pt).model_dump(mode="json") for pt in product_types]
    
    # 3. Store in Cache (Expire in 1 hour)
    await set_cache(CACHE_KEY_CATALOG, catalog_data, expire=3600)
    
    return catalog_data

async def track_visit(db: AsyncSession, obj_in: schemas.TrackVisitCreate):
    from app.domains.products.models import TrafficVisit
    visit = TrafficVisit(source=obj_in.source)
    db.add(visit)
    await db.commit()
    return {"msg": "Tracked"}
