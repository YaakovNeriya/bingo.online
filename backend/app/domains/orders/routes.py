from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional

from app.db.database import get_db
from app.domains.orders import schemas, services
from app.core.security import get_current_user
from app.domains.users.models import User
from app.core.rate_limit import limiter

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
@limiter.limit("5/minute")
async def checkout(
    request: Request,
    request_body: Optional[schemas.CheckoutRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    selected_ids = request_body.selected_item_ids if request_body else None
    return await services.checkout(db, current_user, selected_ids)

@router.get("/active", response_model=Optional[schemas.OrderOut])
async def get_active_order(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await services.get_active_order(db, current_user.id)

@router.post("/{order_id}/revert_to_cart", response_model=schemas.CartOut)
async def revert_order_to_cart(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await services.revert_order_to_cart(db, current_user.id, order_id)

@router.post("/active/items/{cart_item_id}/add", response_model=schemas.ToggleItemResponse)
async def move_cart_item_to_order(
    cart_item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await services.move_cart_item_to_order(db, current_user, cart_item_id)

@router.post("/active/items/{order_item_id}/remove", response_model=schemas.ToggleItemResponse)
async def remove_item_from_active_order(order_item_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await services.move_order_item_to_cart(db, current_user, order_item_id)

@router.delete("/active/items/{order_item_id}")
async def delete_active_order_item(order_item_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await services.delete_active_order_item(db, current_user, order_item_id)
