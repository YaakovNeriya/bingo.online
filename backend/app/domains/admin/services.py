import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domains.products.models import ProductType, ProductModel, ColorSKU
from app.domains.admin import schemas
from app.utils.cache import delete_cache
from app.domains.products.services import CACHE_KEY_CATALOG

async def _invalidate_catalog():
    await delete_cache(CACHE_KEY_CATALOG)

async def create_product_type(db: AsyncSession, obj_in: schemas.ProductTypeCreate) -> ProductType:
    db_obj = ProductType(**obj_in.model_dump())
    db.add(db_obj)
    await db.commit()
    stmt = select(ProductType).where(ProductType.id == db_obj.id).options(selectinload(ProductType.product_models).selectinload(ProductModel.color_skus))
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    await _invalidate_catalog()
    return db_obj

async def create_product_model(db: AsyncSession, obj_in: schemas.ProductModelCreate) -> ProductModel:
    db_obj = ProductModel(**obj_in.model_dump())
    db.add(db_obj)
    await db.commit()
    stmt = select(ProductModel).where(ProductModel.id == db_obj.id).options(selectinload(ProductModel.color_skus))
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    await _invalidate_catalog()
    return db_obj

async def create_color_sku(db: AsyncSession, obj_in: schemas.ColorSKUCreate) -> ColorSKU:
    db_obj = ColorSKU(**obj_in.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    await _invalidate_catalog()
    return db_obj

from typing import Optional

async def update_product_type(db: AsyncSession, type_id: int, obj_in: schemas.ProductTypeUpdate) -> ProductType:
    stmt = select(ProductType).where(ProductType.id == type_id).options(selectinload(ProductType.product_models).selectinload(ProductModel.color_skus))
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if not db_obj:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await _invalidate_catalog()
    return db_obj

async def delete_product_type(db: AsyncSession, type_id: int):
    stmt = select(ProductType).where(ProductType.id == type_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
        await _invalidate_catalog()

async def update_product_model(db: AsyncSession, model_id: int, obj_in: schemas.ProductModelUpdate) -> ProductModel:
    stmt = select(ProductModel).where(ProductModel.id == model_id).options(selectinload(ProductModel.color_skus))
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if not db_obj:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await _invalidate_catalog()
    return db_obj

async def delete_product_model(db: AsyncSession, model_id: int):
    stmt = select(ProductModel).where(ProductModel.id == model_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
        await _invalidate_catalog()

async def update_color_sku(db: AsyncSession, sku_id: int, obj_in: schemas.ColorSKUUpdate) -> ColorSKU:
    stmt = select(ColorSKU).where(ColorSKU.id == sku_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if not db_obj:
        return None

    update_data = obj_in.model_dump(exclude_unset=True)
    
    if "image_urls" in update_data:
        old_urls = set(db_obj.image_urls or [])
        new_urls = set(update_data["image_urls"] or [])
        orphaned = old_urls - new_urls
        for url in orphaned:
            filename = url.split("/")[-1]
            file_path = os.path.join("/app/uploads", filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass

    for k, v in update_data.items():
        setattr(db_obj, k, v)
    await db.commit()
    await _invalidate_catalog()
    return db_obj

async def delete_color_sku(db: AsyncSession, sku_id: int):
    stmt = select(ColorSKU).where(ColorSKU.id == sku_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if db_obj:
        for url in (db_obj.image_urls or []):
            filename = url.split("/")[-1]
            file_path = os.path.join("/app/uploads", filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass
        await db.delete(db_obj)
        await db.commit()
        await _invalidate_catalog()

from datetime import datetime, timedelta
from sqlalchemy import select, func, distinct, desc
from sqlalchemy.orm import selectinload
from typing import List
from app.domains.admin import schemas, models as admin_models
from app.domains.orders.models import Order, Cart, CartItem, OrderItem
from decimal import Decimal

async def get_all_orders(db: AsyncSession):
    stmt = (
        select(Order)
        .order_by(Order.created_at.desc())
        .options(selectinload(Order.items).selectinload(OrderItem.color_sku))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def update_order_status(db: AsyncSession, order_id: int, status: str) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.color_sku))
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if order:
        order.status = status
        await db.commit()
        await db.refresh(order)
    return order

async def get_abandoned_carts(db: AsyncSession):
    threshold = datetime.utcnow() - timedelta(hours=672)
    stmt = (
        select(Cart)
        .where(Cart.updated_at < threshold)
        .options(selectinload(Cart.items).selectinload(CartItem.color_sku))
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def clear_abandoned_carts(db: AsyncSession):
    threshold = datetime.utcnow() - timedelta(hours=672)
    result = await db.execute(select(Cart).where(Cart.updated_at < threshold))
    abandoned_carts = result.scalars().all()
    
    deleted_count = 0
    for cart in abandoned_carts:
        await db.delete(cart)
        deleted_count += 1
        
    await db.commit()
    return {"deleted_carts": deleted_count}

async def get_sales_report(db: AsyncSession):
    orders_result = await db.execute(select(func.sum(Order.total_price), func.count(Order.id)))
    total_revenue, total_orders = orders_result.first()
    
    best_sellers_stmt = (
        select(OrderItem.color_sku_id, func.sum(OrderItem.length_meters * OrderItem.units).label("total_sold"))
        .group_by(OrderItem.color_sku_id)
        .order_by(desc("total_sold"))
        .limit(5)
    )
    best_sellers_result = await db.execute(best_sellers_stmt)
    best_sellers = [{"color_sku_id": row[0], "total_sold": row[1]} for row in best_sellers_result.all()]
    
    from app.domains.products.models import TrafficVisit
    traffic_stmt = select(TrafficVisit.source, func.count(TrafficVisit.id)).group_by(TrafficVisit.source)
    traffic_result = await db.execute(traffic_stmt)
    traffic_sources = {row[0]: row[1] for row in traffic_result.all()}
    
    return {
        "total_revenue": total_revenue or Decimal("0.00"),
        "total_orders": total_orders or 0,
        "best_sellers": best_sellers,
        "traffic_sources": traffic_sources
    }

async def clear_traffic_data(db: AsyncSession):
    from app.domains.products.models import TrafficVisit
    from sqlalchemy import delete
    from app.utils.cache import redis_client
    for key in redis_client.scan_iter("traffic:*"):
        redis_client.delete(key)
    return {"msg": "Traffic data cleared"}

async def get_site_settings(db: AsyncSession) -> List[admin_models.SiteSetting]:
    result = await db.execute(select(admin_models.SiteSetting))
    return result.scalars().all()

async def update_site_setting(db: AsyncSession, key: str, update_in: schemas.SiteSettingUpdate) -> admin_models.SiteSetting:
    result = await db.execute(select(admin_models.SiteSetting).where(admin_models.SiteSetting.key == key))
    setting = result.scalars().first()
    if not setting:
        setting = admin_models.SiteSetting(key=key, value=update_in.value)
        db.add(setting)
    else:
        setting.value = update_in.value
    await db.commit()
    await db.refresh(setting)
    return setting

from app.domains.users.models import Region
from app.domains.users import schemas as user_schemas

async def create_region(db: AsyncSession, obj_in: user_schemas.RegionCreate) -> Region:
    db_obj = Region(**obj_in.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_region(db: AsyncSession, region_id: int, obj_in: user_schemas.RegionCreate) -> Region:
    stmt = select(Region).where(Region.id == region_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if not db_obj:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_region(db: AsyncSession, region_id: int):
    stmt = select(Region).where(Region.id == region_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if db_obj:
        await db.delete(db_obj)
        await db.commit()

from app.domains.users.models import User
from app.domains.orders.models import Order
from app.domains.orders import models as order_models
from sqlalchemy import func
from sqlalchemy.orm import selectinload

async def get_regions_with_customer_count(db: AsyncSession):
    regions = await db.execute(select(Region))
    regions = regions.scalars().all()
    
    counts = await db.execute(select(User.region_id, func.count(User.id)).group_by(User.region_id))
    count_map = {row[0]: row[1] for row in counts.all()}
    
    res = []
    for r in regions:
        res.append({
            "id": r.id,
            "name": r.name,
            "shipping_cost": float(r.shipping_cost),
            "delivery_days": r.delivery_days,
            "customer_count": count_map.get(r.id, 0)
        })
    
    no_region_count = count_map.get(None, 0)
    if no_region_count > 0:
        res.append({
            "id": -1,
            "name": "ללא אזור",
            "shipping_cost": 0.0,
            "delivery_days": 0,
            "customer_count": no_region_count
        })
    return res

async def get_customers_in_region(db: AsyncSession, region_id: str):
    rid = None if region_id == "-1" else int(region_id)
    
    stmt = select(User).where(User.region_id == rid)
    users = (await db.execute(stmt)).scalars().all()
    
    user_ids = [u.id for u in users]
    if not user_ids:
        return []
        
    counts = await db.execute(select(Order.user_id, func.count(Order.id)).where(Order.user_id.in_(user_ids)).group_by(Order.user_id))
    count_map = {row[0]: row[1] for row in counts.all()}
    
    res = []
    for u in users:
        res.append({
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "phone": u.phone,
            "region_id": u.region_id,
            "is_active": u.is_active,
            "is_superuser": u.is_superuser,
            "order_count": count_map.get(u.id, 0)
        })
    return res

async def get_customer_orders(db: AsyncSession, user_id: int):
    stmt = select(Order).where(Order.user_id == user_id).options(
        selectinload(Order.items).selectinload(order_models.OrderItem.color_sku).selectinload(ColorSKU.product_model)
    ).order_by(Order.created_at.desc())
    orders = (await db.execute(stmt)).scalars().all()
    return orders


async def get_customers_in_region_sorted(db: AsyncSession, region_id: str):
    """
    Fetch all customers in a region with their order & cart items,
    then sort them using the Greedy Nearest Neighbor algorithm
    based on shared color_sku_ids.
    """
    from app.domains.admin.smart_sort import sort_customers_by_shared_items
    from app.domains.orders.models import Cart, CartItem

    rid = None if region_id == "-1" else int(region_id)

    # Get all users in this region
    stmt = select(User).where(User.region_id == rid)
    users = (await db.execute(stmt)).scalars().all()

    if not users:
        return []

    user_ids = [u.id for u in users]
    user_map = {u.id: u for u in users}

    # Get all pending orders for these users (with items + sku + product_model + product_type)
    # Exclude "Delivered" orders because the picker doesn't need to pick them again.
    order_stmt = (
        select(Order)
        .where(Order.user_id.in_(user_ids))
        .where(Order.status != "Delivered")
        .options(
            selectinload(Order.items)
            .selectinload(order_models.OrderItem.color_sku)
            .selectinload(ColorSKU.product_model)
            .selectinload(ProductModel.product_type)
        )
    )
    orders = (await db.execute(order_stmt)).scalars().all()

    # Get all carts for these users (with items + sku + product_model + product_type)
    cart_stmt = (
        select(Cart)
        .where(Cart.user_id.in_(user_ids))
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.color_sku)
            .selectinload(ColorSKU.product_model)
            .selectinload(ProductModel.product_type)
        )
    )
    carts = (await db.execute(cart_stmt)).scalars().all()

    # Build customer data with sku_ids and items
    customer_data = {}
    for uid in user_ids:
        customer_data[uid] = {
            'user': user_map[uid],
            'sku_ids': set(),
            'items': [],
            'total': Decimal('0.00')
        }

    # Process orders
    for order in orders:
        uid = order.user_id
        for item in order.items:
            if item.color_sku_id:
                customer_data[uid]['sku_ids'].add(item.color_sku_id)

            price_per_meter = float(item.price_at_purchase) if item.price_at_purchase else 0
            line_total = price_per_meter * float(item.length_meters) * item.units

            pm = item.color_sku.product_model if item.color_sku else None
            customer_data[uid]['items'].append({
                'product_name': pm.name if pm else 'לא ידוע',
                'color_name': item.color_sku.color_name if item.color_sku else 'לא ידוע',
                'category': pm.product_type.name if pm and pm.product_type else 'ללא קטגוריה',
                'sku': item.color_sku.sku if item.color_sku else None,
                'length_meters': float(item.length_meters),
                'units': item.units,
                'price': round(line_total, 2),
                'status': order.status
            })
            customer_data[uid]['total'] += Decimal(str(round(line_total, 2)))

    # Process carts
    cart_map = {c.user_id: c for c in carts}
    for uid, cart in cart_map.items():
        if uid not in customer_data:
            continue
        for item in cart.items:
            if item.color_sku_id:
                customer_data[uid]['sku_ids'].add(item.color_sku_id)

            sku = item.color_sku
            if sku and sku.product_model:
                price_per_meter = float(sku.specific_price if sku.specific_price is not None else sku.product_model.base_price)
            else:
                price_per_meter = 0
            line_total = price_per_meter * float(item.length_meters) * item.units

            pm = sku.product_model if sku else None
            customer_data[uid]['items'].append({
                'product_name': pm.name if pm else 'לא ידוע',
                'color_name': sku.color_name if sku else 'לא ידוע',
                'category': pm.product_type.name if pm and pm.product_type else 'ללא קטגוריה',
                'sku': sku.sku if sku else None,
                'length_meters': float(item.length_meters),
                'units': item.units,
                'price': round(line_total, 2),
                'status': 'בעגלה'
            })
            customer_data[uid]['total'] += Decimal(str(round(line_total, 2)))

    # Filter out customers with 0 items (e.g. all their orders were 'Delivered')
    valid_customers = [c for c in customer_data.values() if len(c['items']) > 0]

    # Sort using the algorithm
    sorted_customers = sort_customers_by_shared_items(valid_customers)

    # Build response
    result = []
    for idx, cust in enumerate(sorted_customers):
        user = cust['user']
        result.append({
            'sort_index': idx + 1,
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name or 'לקוח לא ידוע',
            'last_name': user.last_name,
            'phone': user.phone,
            'items': cust['items'],
            'total': float(cust['total'])
        })

    return result
