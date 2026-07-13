from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from typing import List

from app.domains.products.models import ProductType, ProductModel, ColorSKU
from app.domains.products import schemas
from app.utils.cache import get_cache, set_cache, redis_client
import redis.exceptions
import logging

logger = logging.getLogger(__name__)

CACHE_KEY_CATALOG = "catalog_full"

async def _build_catalog_data(db: AsyncSession) -> list:
    stmt = (
        select(ProductType)
        .options(
            selectinload(ProductType.product_models.and_(ProductModel.is_active == True))
            .selectinload(ProductModel.color_skus.and_(ColorSKU.is_active == True))
        )
        .order_by(ProductType.display_order.asc(), ProductType.id.asc())
    )
    result = await db.execute(stmt)
    product_types = list(result.scalars().all())
    
    # Ensure nested relationships are sorted by display_order then id
    for pt in product_types:
        pt.product_models.sort(key=lambda m: (m.display_order or 0, m.id))
        for pm in pt.product_models:
            pm.color_skus.sort(key=lambda sku: (sku.display_order or 0, sku.id))
    
    # Convert to Pydantic representations for caching as JSON
    return [schemas.ProductTypeOut.model_validate(pt).model_dump(mode="json") for pt in product_types]

async def get_full_catalog(db: AsyncSession) -> List[schemas.ProductTypeOut] | list:
    # 1. Check Redis Cache
    cached_catalog = await get_cache(CACHE_KEY_CATALOG)
    if cached_catalog:
        return cached_catalog
    
    # 2. Cache Miss - Acquire Lock to prevent Cache Stampede
    lock_key = f"{CACHE_KEY_CATALOG}_lock"
    
    try:
        async with redis_client.lock(lock_key, timeout=10, blocking_timeout=5):
            # Double-check inside the lock in case another request just finished building the cache
            cached_catalog = await get_cache(CACHE_KEY_CATALOG)
            if cached_catalog:
                return cached_catalog
            
            # Rebuild catalog from DB
            catalog_data = await _build_catalog_data(db)
            
            # 3. Store in Cache (Expire in 1 hour)
            await set_cache(CACHE_KEY_CATALOG, catalog_data, expire=3600)
            
            return catalog_data
            
    except redis.exceptions.LockError:
        logger.warning("Cache stampede lock timeout for catalog. Falling back to direct DB query.")
        return await _build_catalog_data(db)

async def get_model_stock(db: AsyncSession, model_id: int) -> dict:
    stmt = select(ColorSKU.id, ColorSKU.stock_meters).where(
        ColorSKU.product_model_id == model_id,
        ColorSKU.is_active == True
    )
    result = await db.execute(stmt)
    skus = result.all()
    return {sku.id: sku.stock_meters if sku.stock_meters is not None else 0.0 for sku in skus}

async def track_visit(db: AsyncSession, obj_in: schemas.TrackVisitCreate):
    from app.domains.products.models import TrafficVisit
    visit = TrafficVisit(source=obj_in.source)
    db.add(visit)
    await db.commit()
    return {"msg": "Tracked"}

async def search_products(db: AsyncSession, query: str) -> List[schemas.SearchResultOut]:
    if not query or len(query.strip()) < 2:
        return []
    
    q = query.strip()
    
    # Check if query is a pure number for max price filtering
    is_price_filter = False
    try:
        max_price = float(q)
        is_price_filter = True
    except ValueError:
        pass

    if is_price_filter:
        search_condition = (ProductModel.base_price <= max_price)
    else:
        search_condition = or_(
            ProductModel.name.ilike(f"%{q}%"),
            ProductType.name.ilike(f"%{q}%"),
            ColorSKU.color_name.ilike(f"%{q}%")
        )

    stmt = (
        select(ProductModel)
        .options(
            selectinload(ProductModel.product_type),
            selectinload(ProductModel.color_skus)
        )
        .join(ProductType, ProductModel.product_type_id == ProductType.id)
        .outerjoin(ColorSKU, ProductModel.id == ColorSKU.product_model_id)
        .where(
            ProductModel.is_active == True,
            search_condition
        )
    )
    
    if is_price_filter:
        stmt = stmt.order_by(ProductModel.base_price.desc())
        
    stmt = stmt.distinct().limit(10)
    
    result = await db.execute(stmt)
    models = result.scalars().all()
    
    results = []
    for model in models:
        image_url = None
        for sku in model.color_skus:
            if sku.image_urls and len(sku.image_urls) > 0:
                image_url = sku.image_urls[-1]
                break
                
        results.append(schemas.SearchResultOut(
            id=model.id,
            name=model.name,
            type_name=model.product_type.name,
            price=model.base_price,
            image_url=image_url
        ))
        
    return results
