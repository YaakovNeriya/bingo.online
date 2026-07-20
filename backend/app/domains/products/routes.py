from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app.db.database import get_db
from app.domains.products import schemas, services

router = APIRouter()

@router.get("/public/settings")
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    from app.domains.admin.models import SiteSetting
    from app.domains.users.models import User
    from sqlalchemy import select
    result = await db.execute(select(SiteSetting))
    settings = result.scalars().all()
    # Return as dict for easy access on frontend
    settings_dict = {s.key: s.value for s in settings}
    
    # Dynamically link the whatsapp contact to the primary admin's phone
    admin_result = await db.execute(select(User).where(User.is_superuser == True).order_by(User.id).limit(1))
    admin_user = admin_result.scalar_one_or_none()
    if admin_user and admin_user.phone:
        settings_dict["about_whatsapp"] = admin_user.phone
        
    return settings_dict

@router.get("/catalog", response_model=List[schemas.ProductTypeOut])
async def get_catalog(db: AsyncSession = Depends(get_db)) -> Any:
    """
    Get full active product catalog, cached by Redis.
    """
    return await services.get_full_catalog(db)

@router.get("/models/{model_id}/stock")
async def get_model_stock(model_id: int, db: AsyncSession = Depends(get_db)) -> Any:
    """
    Get real-time available stock (meters) for all SKUs of a specific model.
    """
    return await services.get_model_stock(db, model_id)

@router.get("/search", response_model=List[schemas.SearchResultOut])
async def search_products(q: str, db: AsyncSession = Depends(get_db)):
    """
    Live search for products by query string.
    """
    return await services.search_products(db, q)

@router.post("/track-visit")
async def track_visit(obj_in: schemas.TrackVisitCreate, db: AsyncSession = Depends(get_db)):
    return await services.track_visit(db, obj_in)
