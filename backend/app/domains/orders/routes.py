from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.database import get_db
from app.domains.orders import schemas, services
from app.core.security import get_current_user
from app.domains.users.models import User

router = APIRouter()

@router.get("/cart", response_model=schemas.CartOut)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await services.get_or_create_cart(db, current_user.id)

@router.post("/cart", response_model=schemas.CartOut)
async def add_to_cart(
    item_in: schemas.CartItemAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = await services.add_item_to_cart(db, current_user.id, item_in)
    return cart

@router.delete("/cart/items/{item_id}", response_model=schemas.CartOut)
async def remove_cart_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = await services.remove_cart_item(db, current_user.id, item_id)
    return cart

@router.patch("/cart/items/status", response_model=schemas.CartOut)
async def update_cart_items_status(
    update_in: schemas.CartItemStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = await services.update_cart_items_status(db, current_user.id, update_in)
    return cart

@router.patch("/cart/items/{item_id}", response_model=schemas.CartOut)
async def update_cart_item(
    item_id: int,
    update_in: schemas.CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cart = await services.update_cart_item_units(db, current_user.id, item_id, update_in)
    return cart

@router.post("/checkout", response_model=schemas.OrderOut)
async def checkout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await services.checkout(db, current_user)
