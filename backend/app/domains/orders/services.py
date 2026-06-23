from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from decimal import Decimal
import asyncio

from app.domains.orders.models import Cart, CartItem, Order, OrderItem
from app.domains.products.models import ColorSKU
from app.domains.users.models import User
from app.domains.orders import schemas
from app.core.exceptions import AppException
from app.utils.email_service import send_order_confirmation

async def get_or_create_cart(db: AsyncSession, user_id: int) -> Cart:
    result = await db.execute(select(Cart).where(Cart.user_id == user_id).options(selectinload(Cart.items).selectinload(CartItem.color_sku).selectinload(ColorSKU.product_model)))
    cart = result.scalars().first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        await db.refresh(cart)
    return cart

async def _get_min_cut_length(db: AsyncSession) -> Decimal:
    from app.domains.admin.models import SiteSetting
    result = await db.execute(select(SiteSetting).where(SiteSetting.key == 'minimum_order_length'))
    setting = result.scalars().first()
    if setting and setting.value:
        try:
            return Decimal(setting.value)
        except:
            pass
    return Decimal('1.0')

async def add_item_to_cart(db: AsyncSession, user_id: int, item_in: schemas.CartItemAdd) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    
    result = await db.execute(select(ColorSKU).where(ColorSKU.id == item_in.color_sku_id))
    sku = result.scalars().first()
    if not sku or not sku.is_active:
        raise AppException(status_code=404, detail="Product not found or inactive")

    existing_item = next((item for item in cart.items if item.color_sku_id == item_in.color_sku_id and item.length_meters == item_in.length_meters), None)
    
    total_requested_for_this_sku = (item_in.length_meters * item_in.units)
    for item in cart.items:
        if item.color_sku_id == item_in.color_sku_id:
            total_requested_for_this_sku += (item.length_meters * item.units)
            
    if sku.stock_meters < total_requested_for_this_sku:
        raise AppException(status_code=400, detail=f"לא ניתן להוסיף. המלאי הזמין הוא {sku.stock_meters} מטרים.")
        
    min_cut_length = await _get_min_cut_length(db)
    if item_in.length_meters < min_cut_length:
        raise AppException(status_code=400, detail=f"אורך מינימלי לחתיכה הוא {min_cut_length} מטרים.")

    if existing_item:
        existing_item.units += item_in.units
    else:
        new_item = CartItem(
            cart_id=cart.id,
            color_sku_id=item_in.color_sku_id,
            length_meters=item_in.length_meters,
            units=item_in.units
        )
        db.add(new_item)
    
    await db.commit()
    return await get_or_create_cart(db, user_id)

async def remove_cart_item(db: AsyncSession, user_id: int, item_id: int) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    item = next((item for item in cart.items if item.id == item_id), None)
    if not item:
        raise AppException(status_code=404, detail="Item not found in cart")
    
    await db.delete(item)
    await db.commit()
    return await get_or_create_cart(db, user_id)

async def update_cart_item_units(db: AsyncSession, user_id: int, item_id: int, update_in: schemas.CartItemUpdate) -> Cart:
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

async def update_cart_items_status(db: AsyncSession, user_id: int, update_in: schemas.CartItemStatusUpdate) -> Cart:
    from sqlalchemy import update
    cart = await get_or_create_cart(db, user_id)
    cart_item_ids = {item.id for item in cart.items}
    for item_id in update_in.item_ids:
        if item_id not in cart_item_ids:
            raise AppException(status_code=404, detail=f"CartItem {item_id} not found in user's cart")
            
    if update_in.item_ids:
        stmt = update(CartItem).where(CartItem.id.in_(update_in.item_ids)).values(status=update_in.status)
        await db.execute(stmt)
        await db.commit()
        
    return await get_or_create_cart(db, user_id)

async def checkout(db: AsyncSession, user: User) -> Order:
    cart = await get_or_create_cart(db, user.id)
    if not cart.items:
        raise AppException(status_code=400, detail="Cart is empty")

    total_price = Decimal("0.00")
    order_items = []
    
    sku_ids = sorted([item.color_sku_id for item in cart.items])

    stmt = select(ColorSKU).options(joinedload(ColorSKU.product_model)).where(ColorSKU.id.in_(sku_ids)).with_for_update()
    result = await db.execute(stmt)
    locked_skus = {sku.id: sku for sku in result.scalars().all()}
    
    for cart_item in cart.items:
        sku = locked_skus.get(cart_item.color_sku_id)
        if not sku:
            raise AppException(status_code=400, detail=f"Product {cart_item.color_sku_id} not available")
            
        item_total_meters = cart_item.length_meters * cart_item.units
            
        if sku.stock_meters < item_total_meters:
            raise AppException(status_code=400, detail=f"Not enough stock for {sku.color_name}. Available: {sku.stock_meters}")
            
        sku.stock_meters -= item_total_meters
        
        price_per_meter = sku.specific_price if sku.specific_price is not None else sku.product_model.base_price
        item_total = price_per_meter * item_total_meters
        total_price += item_total
        
        order_items.append(
            OrderItem(
                color_sku_id=sku.id,
                length_meters=cart_item.length_meters,
                units=cart_item.units,
                price_at_purchase=price_per_meter
            )
        )
        
    await db.refresh(user, ["region"])
    total_price += user.region.shipping_cost
    
    new_order = Order(
        user_id=user.id,
        status="Received",
        total_price=total_price,
        items=order_items
    )
    db.add(new_order)
    
    for item in cart.items:
        await db.delete(item)
        
    await db.commit()
    await db.refresh(new_order)
    
    asyncio.create_task(asyncio.to_thread(send_order_confirmation, user.email, new_order.id, float(new_order.total_price)))
    
    return new_order
