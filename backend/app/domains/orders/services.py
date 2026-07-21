from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from decimal import Decimal
import asyncio
from typing import List, Optional
from datetime import datetime, timezone

from app.domains.orders.models import Cart, CartItem, Order, OrderItem
from app.domains.products.models import ColorSKU
from app.domains.users.models import User
from app.domains.orders import schemas
from app.core.exceptions import AppException
from app.utils.email_service import send_order_confirmation
from app.core.audit import log_audit_action
from app.utils.cache import delete_cache
from app.domains.products.services import CACHE_KEY_CATALOG

async def _check_deadline_passed(db: AsyncSession, user_id: int):
    from app.domains.users.services import get_user_deadline
    deadline = await get_user_deadline(db, user_id)
    if deadline:
        now = datetime.now(timezone.utc)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if now > deadline:
            raise AppException(status_code=403, detail="חלון ההזמנות לעונה זו נסגר. לא ניתן לשנות את העגלה או לשלוח הזמנה.")

async def get_or_create_cart(db: AsyncSession, user_id: int) -> Cart:
    stmt = select(Cart).where(Cart.user_id == user_id).options(selectinload(Cart.items).selectinload(CartItem.color_sku).selectinload(ColorSKU.product_model)).execution_options(populate_existing=True)
    result = await db.execute(stmt)
    cart = result.scalars().first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        result = await db.execute(select(Cart).where(Cart.id == cart.id).options(selectinload(Cart.items).selectinload(CartItem.color_sku).selectinload(ColorSKU.product_model)))
        cart = result.scalars().first()
    return cart

async def _get_min_cut_length(db: AsyncSession) -> Decimal:
    from app.domains.admin.models import SiteSetting
    result = await db.execute(select(SiteSetting).where(SiteSetting.key == 'minimum_order_length'))
    setting = result.scalars().first()
    if setting and setting.value:
        try:
            return Decimal(setting.value)
        except Exception as e:
            logger.warning(f"Failed to parse minimum_order_length value '{setting.value}' as Decimal: {e}. Falling back to 1.0.")
    return Decimal('1.0')

async def add_item_to_cart(db: AsyncSession, user: User, item_in: schemas.CartItemAdd) -> dict:
    await _check_deadline_passed(db, user.id)
    cart = await get_or_create_cart(db, user.id)
    active_order = await get_active_order(db, user.id)
    
    result = await db.execute(select(ColorSKU).where(ColorSKU.id == item_in.color_sku_id))
    sku = result.scalars().first()
    if not sku or not sku.is_active:
        raise AppException(status_code=404, detail="Product not found or inactive")

    existing_item = next((item for item in cart.items if item.color_sku_id == item_in.color_sku_id and item.length_meters == item_in.length_meters), None)
    
    total_requested_for_this_sku = Decimal(str(item_in.length_meters)) * Decimal(str(item_in.units))
    for item in cart.items:
        if item.color_sku_id == item_in.color_sku_id:
            total_requested_for_this_sku += (Decimal(str(item.length_meters)) * Decimal(str(item.units)))
            
    if Decimal(str(sku.stock_meters)) < total_requested_for_this_sku:
        raise AppException(status_code=400, detail=f"לא ניתן להוסיף. המלאי הזמין הוא {sku.stock_meters} מטרים.")
        
    min_cut_length = await _get_min_cut_length(db)
    if item_in.length_meters < min_cut_length:
        raise AppException(status_code=400, detail=f"אורך מינימלי לחתיכה הוא {min_cut_length} מטרים.")

    if existing_item:
        existing_item.units += item_in.units
        await db.commit()
        cart_item_id = existing_item.id
    else:
        new_item = CartItem(
            cart_id=cart.id,
            color_sku_id=item_in.color_sku_id,
            length_meters=item_in.length_meters,
            units=item_in.units
        )
        db.add(new_item)
        await db.commit()
        cart_item_id = new_item.id
        
    if active_order:
        return await move_cart_item_to_order(db, user, cart_item_id)
        
    updated_cart = await get_or_create_cart(db, user.id)
    cart_count = sum(item.units for item in updated_cart.items) if updated_cart else 0
    return {
        "cart": updated_cart,
        "active_order": active_order,
        "cart_count": cart_count
    }

async def remove_cart_item(db: AsyncSession, user_id: int, item_id: int) -> Cart:
    await _check_deadline_passed(db, user_id)
    cart = await get_or_create_cart(db, user_id)
    item = next((item for item in cart.items if item.id == item_id), None)
    if not item:
        raise AppException(status_code=404, detail="Item not found in cart")
    
    await db.delete(item)
    await db.commit()
    return await get_or_create_cart(db, user_id)

async def update_cart_item_units(db: AsyncSession, user_id: int, item_id: int, update_in: schemas.CartItemUpdate) -> Cart:
    await _check_deadline_passed(db, user_id)
    cart = await get_or_create_cart(db, user_id)
    item = next((item for item in cart.items if item.id == item_id), None)
    if not item:
        raise AppException(status_code=404, detail="Item not found in cart")
        
    result = await db.execute(select(ColorSKU).where(ColorSKU.id == item.color_sku_id))
    sku = result.scalars().first()
    
    new_length = update_in.length_meters if update_in.length_meters is not None else item.length_meters
    new_units = update_in.units if update_in.units is not None else item.units
    
    total_requested_for_this_sku = (new_length * new_units)
    for other in cart.items:
        if other.color_sku_id == item.color_sku_id and other.id != item.id:
            total_requested_for_this_sku += (other.length_meters * other.units)
            
    if sku.stock_meters < total_requested_for_this_sku:
        raise AppException(status_code=400, detail=f"לא ניתן לעדכן. המלאי הזמין הוא {sku.stock_meters} מטרים.")
        
    min_cut_length = await _get_min_cut_length(db)
    if new_length < min_cut_length:
        raise AppException(status_code=400, detail=f"אורך מינימלי לחתיכה הוא {min_cut_length} מטרים.")
        
    if update_in.length_meters is not None:
        item.length_meters = update_in.length_meters
    if update_in.units is not None:
        item.units = update_in.units
        
    await db.commit()
    return await get_or_create_cart(db, user_id)



async def checkout(db: AsyncSession, user: User, selected_item_ids: Optional[List[int]] = None) -> Order:
    await _check_deadline_passed(db, user.id)
    cart = await get_or_create_cart(db, user.id)
    
    if selected_item_ids is None:
        selected_item_ids = [item.id for item in cart.items]
        
    items_to_checkout = [item for item in cart.items if item.id in selected_item_ids]
    if not items_to_checkout:
        raise AppException(status_code=400, detail="No items selected for checkout")

    total_price = Decimal("0.00")
    order_items = []
    
    sku_ids = sorted([item.color_sku_id for item in items_to_checkout])

    # Close the implicit transaction started by previous selects
    await db.commit()

    # Start an atomic transaction block for inventory and order creation
    async with db.begin():
        stmt = select(ColorSKU).options(joinedload(ColorSKU.product_model)).where(ColorSKU.id.in_(sku_ids)).with_for_update().execution_options(populate_existing=True)
        result = await db.execute(stmt)
        locked_skus = {sku.id: sku for sku in result.scalars().all()}
        
        for cart_item in items_to_checkout:
            sku = locked_skus.get(cart_item.color_sku_id)
            if not sku:
                raise AppException(status_code=400, detail=f"Product {cart_item.color_sku_id} not available")
                
            item_total_meters = cart_item.length_meters * cart_item.units
                
            if sku.stock_meters < item_total_meters:
                raise AppException(status_code=400, detail=f"המלאי הזמין עבור הצבע {sku.color_name} הוא {sku.stock_meters} מטרים בלבד.")
                
            sku.stock_meters -= item_total_meters
            
            price_per_meter = sku.specific_price if sku.specific_price is not None else sku.product_model.base_price
            item_total = price_per_meter * item_total_meters
            total_price += item_total
            
            order_items.append(
                OrderItem(
                    color_sku_id=sku.id,
                    length_meters=cart_item.length_meters,
                    units=cart_item.units,
                    price_at_purchase=price_per_meter,
                    historical_product_name=sku.product_model.name if sku.product_model else "מוצר לא ידוע",
                    historical_color_name=sku.color_name
                )
            )
            
        await db.refresh(user, ["region"])
        if not user.region:
            raise AppException(status_code=400, detail="אנא הגדר אזור משלוח בפרופיל לפני ביצוע ההזמנה.")
        total_price += user.region.shipping_cost
        
        new_order = Order(
            user_id=user.id,
            status="order_unpaid",
            total_price=total_price,
            items=order_items
        )
        db.add(new_order)
        
        await db.flush()
        await log_audit_action(
            db=db,
            admin_id=user.id,
            action="CREATE_ORDER",
            entity_type="Order",
            entity_id=new_order.id,
            changes={"total_price": str(total_price), "items_count": len(order_items)}
        )
        
        for item in items_to_checkout:
            await db.delete(item)
            
    # Session automatically commits at the end of the `db.begin()` block if no exceptions are raised.
    # We must refresh the new order outside the transaction to load generated fields like id.
    result = await db.execute(
        select(Order)
        .where(Order.id == new_order.id)
        .options(selectinload(Order.items).selectinload(OrderItem.color_sku).selectinload(ColorSKU.product_model))
    )
    new_order = result.scalars().first()
    
    asyncio.create_task(asyncio.to_thread(send_order_confirmation, user.email, new_order.id, Decimal(str(new_order.total_price))))
    
    await delete_cache(CACHE_KEY_CATALOG)
    
    return new_order

async def get_active_order(db: AsyncSession, user_id: int) -> Optional[Order]:
    stmt = select(Order).where(Order.user_id == user_id, Order.status == "order_unpaid").options(
        selectinload(Order.items).selectinload(OrderItem.color_sku).selectinload(ColorSKU.product_model)
    ).order_by(Order.created_at.desc()).execution_options(populate_existing=True)
    result = await db.execute(stmt)
    return result.scalars().first()

async def revert_order_to_cart(db: AsyncSession, user_id: int, order_id: int) -> Cart:
    await _check_deadline_passed(db, user_id)
    stmt = select(Order).where(Order.id == order_id, Order.user_id == user_id).options(selectinload(Order.items))
    result = await db.execute(stmt)
    order = result.scalars().first()
    
    if not order:
        raise AppException(status_code=404, detail="Order not found")
        
    if order.status != "order_unpaid":
        raise AppException(status_code=400, detail="Cannot revert an order that is already paid or locked")
        
    cart = await get_or_create_cart(db, user_id)
    
    sku_ids = [item.color_sku_id for item in order.items if item.color_sku_id is not None]
    
    await db.commit()
    
    async with db.begin():
        if sku_ids:
            sku_stmt = select(ColorSKU).where(ColorSKU.id.in_(sku_ids)).with_for_update().execution_options(populate_existing=True)
            sku_result = await db.execute(sku_stmt)
            locked_skus = {sku.id: sku for sku in sku_result.scalars().all()}
        else:
            locked_skus = {}
            
        for order_item in order.items:
            if order_item.color_sku_id and order_item.color_sku_id in locked_skus:
                sku = locked_skus[order_item.color_sku_id]
                item_total_meters = order_item.length_meters * order_item.units
                sku.stock_meters += item_total_meters
                
            new_cart_item = CartItem(
                cart_id=cart.id,
                color_sku_id=order_item.color_sku_id,
                length_meters=order_item.length_meters,
                units=order_item.units
            )
            db.add(new_cart_item)
            
        await db.delete(order)
        
        await log_audit_action(
            db=db,
            admin_id=user_id,
            action="REVERT_ORDER",
            entity_type="Order",
            entity_id=order.id,
            changes={"status": "reverted_to_cart"}
        )
        
    await delete_cache(CACHE_KEY_CATALOG)
        
    return await get_or_create_cart(db, user_id)

async def move_cart_item_to_order(db: AsyncSession, user: User, cart_item_id: int) -> Order:
    await _check_deadline_passed(db, user.id)
    cart = await get_or_create_cart(db, user.id)
    
    order = await get_active_order(db, user.id)
    if not order:
        raise AppException(status_code=400, detail="No active order found. Use checkout instead.")
        
    await db.commit()
    
    async with db.begin():
        stmt = select(CartItem).where(CartItem.id == cart_item_id, CartItem.cart_id == cart.id)
        result = await db.execute(stmt)
        cart_item = result.scalars().first()
        
        if not cart_item:
            raise AppException(status_code=404, detail="CartItem not found")
            
        sku_stmt = select(ColorSKU).options(joinedload(ColorSKU.product_model)).where(ColorSKU.id == cart_item.color_sku_id).with_for_update().execution_options(populate_existing=True)
        sku_result = await db.execute(sku_stmt)
        sku = sku_result.scalars().first()
        
        if not sku:
            raise AppException(status_code=404, detail="Product not available")
            
        item_total_meters = cart_item.length_meters * cart_item.units
        if sku.stock_meters < item_total_meters:
            raise AppException(status_code=400, detail=f"המלאי הזמין עבור הצבע {sku.color_name} הוא {sku.stock_meters} מטרים בלבד.")
            
        sku.stock_meters -= item_total_meters
        
        price_per_meter = sku.specific_price if sku.specific_price is not None else sku.product_model.base_price
        item_total = price_per_meter * item_total_meters
        
        order_stmt = select(Order).where(Order.id == order.id).with_for_update().execution_options(populate_existing=True)
        order_result = await db.execute(order_stmt)
        locked_order = order_result.scalars().first()
        
        locked_order.total_price += item_total
        
        new_order_item = OrderItem(
            order_id=locked_order.id,
            color_sku_id=sku.id,
            length_meters=cart_item.length_meters,
            units=cart_item.units,
            price_at_purchase=price_per_meter,
            historical_product_name=sku.product_model.name if sku.product_model else "מוצר לא ידוע",
            historical_color_name=sku.color_name
        )
        db.add(new_order_item)
        await db.delete(cart_item)
        
    await delete_cache(CACHE_KEY_CATALOG)
    
    updated_order = await get_active_order(db, user.id)
    updated_cart = await get_or_create_cart(db, user.id)
    cart_count = sum(item.units for item in updated_cart.items) if updated_cart else 0
    return {
        "cart": updated_cart,
        "active_order": updated_order,
        "cart_count": cart_count
    }

async def move_order_item_to_cart(db: AsyncSession, user: User, order_item_id: int) -> dict:
    await _check_deadline_passed(db, user.id)
    order = await get_active_order(db, user.id)
    if not order:
        raise AppException(status_code=404, detail="Active order not found")
        
    cart = await get_or_create_cart(db, user.id)
    
    await db.commit()
    
    async with db.begin():
        stmt = select(OrderItem).where(OrderItem.id == order_item_id, OrderItem.order_id == order.id)
        result = await db.execute(stmt)
        order_item = result.scalars().first()
        
        if not order_item:
            raise AppException(status_code=404, detail="OrderItem not found")
            
        if not order_item.color_sku_id:
            raise AppException(status_code=400, detail="לא ניתן להחזיר לעגלה פריט שהוסר מהקטלוג")
            
        if order_item.color_sku_id:
            sku_stmt = select(ColorSKU).where(ColorSKU.id == order_item.color_sku_id).with_for_update().execution_options(populate_existing=True)
            sku_result = await db.execute(sku_stmt)
            sku = sku_result.scalars().first()
            if sku:
                sku.stock_meters += order_item.length_meters * order_item.units
                
        order_stmt = select(Order).where(Order.id == order.id).with_for_update().execution_options(populate_existing=True)
        order_result = await db.execute(order_stmt)
        locked_order = order_result.scalars().first()
        
        item_total = order_item.price_at_purchase * order_item.length_meters * order_item.units
        locked_order.total_price -= item_total
        
        new_cart_item = CartItem(
            cart_id=cart.id,
            color_sku_id=order_item.color_sku_id,
            length_meters=order_item.length_meters,
            units=order_item.units
        )
        db.add(new_cart_item)
        await db.delete(order_item)
        await db.flush()
        new_cart_item_id = new_cart_item.id
        
    await delete_cache(CACHE_KEY_CATALOG)
    
    updated_order = await get_active_order(db, user.id)
    updated_cart = await get_or_create_cart(db, user.id)
    cart_count = sum(item.units for item in updated_cart.items) if updated_cart else 0
    return {
        "cart": updated_cart,
        "active_order": updated_order,
        "cart_count": cart_count,
        "new_cart_item_id": new_cart_item_id
    }

async def delete_active_order_item(db: AsyncSession, user: User, order_item_id: int) -> dict:
    await _check_deadline_passed(db, user.id)
    order = await get_active_order(db, user.id)
    if not order:
        raise AppException(status_code=404, detail="Active order not found")
        
    await db.commit()
        
    async with db.begin():
        stmt = select(OrderItem).where(OrderItem.id == order_item_id, OrderItem.order_id == order.id)
        result = await db.execute(stmt)
        order_item = result.scalars().first()
        
        if not order_item:
            raise AppException(status_code=404, detail="OrderItem not found")
            
        if order_item.color_sku_id:
            sku_stmt = select(ColorSKU).where(ColorSKU.id == order_item.color_sku_id).with_for_update().execution_options(populate_existing=True)
            sku_result = await db.execute(sku_stmt)
            sku = sku_result.scalars().first()
            if sku:
                sku.stock_meters += order_item.length_meters * order_item.units
                
        order_stmt = select(Order).where(Order.id == order.id).with_for_update().execution_options(populate_existing=True)
        order_result = await db.execute(order_stmt)
        locked_order = order_result.scalars().first()
        
        item_total = order_item.price_at_purchase * order_item.length_meters * order_item.units
        locked_order.total_price -= item_total
        
        await db.delete(order_item)
        
    await delete_cache(CACHE_KEY_CATALOG)
    return {"status": "success"}
