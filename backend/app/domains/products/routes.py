from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app.db.database import get_db
from app.domains.products import schemas, services

router = APIRouter()

@router.get("/public/settings")
async def get_public_settings(db: AsyncSession = Depends(get_db)):
    from app.domains.admin.models import SiteSetting
    from sqlalchemy import select
    result = await db.execute(select(SiteSetting))
    settings = result.scalars().all()
    # Return as dict for easy access on frontend
    return {s.key: s.value for s in settings}

@router.get("/catalog", response_model=List[schemas.ProductTypeOut])
async def get_catalog(db: AsyncSession = Depends(get_db)) -> Any:
    """
    Get full active product catalog, cached by Redis.
    """
    return await services.get_full_catalog(db)

@router.post("/track-visit")
async def track_visit(obj_in: schemas.TrackVisitCreate, db: AsyncSession = Depends(get_db)):
    return await services.track_visit(db, obj_in)
