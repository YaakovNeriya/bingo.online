import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.domains.products.models import ProductType, ProductModel, ColorSKU
from app.domains.admin import schemas
from app.utils.cache import delete_cache
from app.domains.products.services import CACHE_KEY_CATALOG

async def _invalidate_catalog():
    await delete_cache(CACHE_KEY_CATALOG)

async def create_product_type(db: AsyncSession, obj_in: schemas.ProductTypeCreate) -> ProductType:
    db_obj = ProductType(**obj_in.model_dump())
    db_obj.display_order = (await _get_max_order(db, ProductType)) + 1
    db.add(db_obj)
    await db.commit()
    stmt = select(ProductType).where(ProductType.id == db_obj.id).options(selectinload(ProductType.product_models).selectinload(ProductModel.color_skus))
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    await _invalidate_catalog()
    return db_obj

async def create_product_model(db: AsyncSession, obj_in: schemas.ProductModelCreate) -> ProductModel:
    db_obj = ProductModel(**obj_in.model_dump())
    db_obj.display_order = (await _get_max_order(db, ProductModel, product_type_id=obj_in.product_type_id)) + 1
    db.add(db_obj)
    await db.commit()
    stmt = select(ProductModel).where(ProductModel.id == db_obj.id).options(selectinload(ProductModel.color_skus))
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    await _invalidate_catalog()
    return db_obj

async def create_color_sku(db: AsyncSession, obj_in: schemas.ColorSKUCreate) -> ColorSKU:
    db_obj = ColorSKU(**obj_in.model_dump())
    db_obj.display_order = (await _get_max_order(db, ColorSKU, product_model_id=obj_in.product_model_id)) + 1
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
    from sqlalchemy.orm import selectinload
    stmt = select(ProductType).options(
        selectinload(ProductType.product_models).selectinload(ProductModel.color_skus)
    ).where(ProductType.id == type_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if db_obj:
        import os
        for model in db_obj.product_models:
            for sku in model.color_skus:
                for url in (sku.image_urls or []):
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
    from sqlalchemy.orm import selectinload
    stmt = select(ProductModel).options(selectinload(ProductModel.color_skus)).where(ProductModel.id == model_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if db_obj:
        import os
        for sku in db_obj.color_skus:
            for url in (sku.image_urls or []):
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

async def update_color_sku(db: AsyncSession, sku_id: int, obj_in: schemas.ColorSKUUpdate, admin_id: int) -> ColorSKU:
    stmt = select(ColorSKU).where(ColorSKU.id == sku_id)
    result = await db.execute(stmt)
    db_obj = result.scalars().first()
    if not db_obj:
        return None

    update_data = obj_in.model_dump(exclude_unset=True)
    
    # Track old values for audit
    old_values = {k: getattr(db_obj, k) for k in update_data.keys() if hasattr(db_obj, k)}
    # Serialize Decimals for JSON compatibility
    for k, v in old_values.items():
        if hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict, type(None))):
            old_values[k] = str(v)
            
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
        
    # Serialize new values for JSON compatibility
    new_values = {k: v for k, v in update_data.items()}
    for k, v in new_values.items():
        if hasattr(v, '__str__') and not isinstance(v, (str, int, float, bool, list, dict, type(None))):
            new_values[k] = str(v)

    await log_audit_action(
        db=db,
        admin_id=admin_id,
        action="UPDATE_PRODUCT_SKU",
        entity_type="ColorSKU",
        entity_id=db_obj.id,
        changes={"old": old_values, "new": new_values}
    )

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
        .options(
            selectinload(Order.user).selectinload(User.region),
            selectinload(Order.items).selectinload(OrderItem.color_sku).selectinload(ColorSKU.product_model)
        )
    )
    result = await db.execute(stmt)
    orders = list(result.scalars().all())
    
    # Also fetch active carts to show them as "cart" status orders
    cart_stmt = (
        select(Cart)
        .options(
            selectinload(Cart.user).selectinload(User.region),
            selectinload(Cart.items).selectinload(CartItem.color_sku).selectinload(ColorSKU.product_model)
        )
    )
    cart_result = await db.execute(cart_stmt)
    carts = cart_result.scalars().all()
    
    virtual_orders = []
    for cart in carts:
        pending_items = [item for item in cart.items if item.status == 'pending']
        if pending_items:
            total_price = Decimal("0.0")
            cart_items_out = []
            for item in pending_items:
                sku = item.color_sku
                if sku and sku.product_model:
                    price_per_meter = Decimal(str(sku.specific_price if sku.specific_price is not None else sku.product_model.base_price))
                else:
                    price_per_meter = Decimal('0.0')
                
                line_total = price_per_meter * Decimal(str(item.length_meters)) * Decimal(str(item.units))
                total_price += line_total
                
                cart_items_out.append(
                    OrderItem(
                        id=-item.id,
                        length_meters=item.length_meters,
                        units=item.units,
                        price_at_purchase=price_per_meter,
                        historical_product_name=sku.product_model.name if sku and sku.product_model else None,
                        historical_color_name=sku.color_name if sku else None,
                        color_sku=sku
                    )
                )
            
            # Create a virtual Order object
            virtual_order = Order(
                id=-cart.id,
                user_id=cart.user_id,
                status="cart",
                total_price=total_price,
                created_at=cart.updated_at,
            )
            # Attach relationships manually so they are available in Pydantic serialization
            virtual_order.user = cart.user
            virtual_order.items = cart_items_out
            virtual_orders.append(virtual_order)
            
    # Combine and sort by created_at desc
    all_combined = orders + virtual_orders
    all_combined.sort(key=lambda o: o.created_at, reverse=True)
    return all_combined

from app.core.audit import log_audit_action

async def update_order_status(db: AsyncSession, order_id: int, status: str, admin_id: int) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.user).selectinload(User.region), selectinload(Order.items).selectinload(OrderItem.color_sku).selectinload(ColorSKU.product_model))
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if order:
        old_status = order.status
        order.status = status
        
        await log_audit_action(
            db=db,
            admin_id=admin_id,
            action="UPDATE_ORDER_STATUS",
            entity_type="Order",
            entity_id=order.id,
            changes={"old_status": old_status, "new_status": status}
        )
        
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
        # If the old value was an uploaded file and it is being replaced, delete the old file
        if setting.value and setting.value.startswith("/uploads/") and setting.value != update_in.value:
            old_filename = setting.value.split("/")[-1]
            file_path = os.path.join("/app/uploads", old_filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass
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
            "shipping_cost": Decimal(str(r.shipping_cost)) if r.shipping_cost else Decimal("0.0"),
            "delivery_days": r.delivery_days,
            "customer_count": count_map.get(r.id, 0)
        })
    
    no_region_count = count_map.get(None, 0)
    if no_region_count > 0:
        res.append({
            "id": -1,
            "name": "ללא אזור",
            "shipping_cost": Decimal("0.0"),
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
        
    from app.domains.orders.models import Cart, CartItem
    
    # Count active orders (exclude archived)
    order_stmt = select(Order.user_id, func.count(Order.id)).where(
        Order.user_id.in_(user_ids),
        Order.status != "archived"
    ).group_by(Order.user_id)
    counts = await db.execute(order_stmt)
    count_map = {row[0]: row[1] for row in counts.all()}
    
    # Count items in active carts (only pending)
    cart_stmt = select(Cart.user_id, func.count(CartItem.id)).join(CartItem).where(
        Cart.user_id.in_(user_ids),
        CartItem.status == 'pending'
    ).group_by(Cart.user_id)
    cart_counts = await db.execute(cart_stmt)
    cart_map = {row[0]: row[1] for row in cart_counts.all()}
    
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
            "order_count": count_map.get(u.id, 0),
            "cart_items_count": cart_map.get(u.id, 0)
        })
    return res

async def get_customer_orders(db: AsyncSession, user_id: int):
    stmt = select(Order).where(Order.user_id == user_id).options(
        selectinload(Order.items).selectinload(order_models.OrderItem.color_sku).selectinload(ColorSKU.product_model)
    ).order_by(Order.created_at.desc())
    orders = list((await db.execute(stmt)).scalars().all())
    
    from app.domains.orders.models import Cart, CartItem
    cart_stmt = select(Cart).where(Cart.user_id == user_id).options(
        selectinload(Cart.items).selectinload(CartItem.color_sku).selectinload(ColorSKU.product_model)
    )
    cart = (await db.execute(cart_stmt)).scalars().first()
    
    result = []
    if cart and cart.items:
        pending_items = [item for item in cart.items if item.status == 'pending']

        def _build_virtual_order(items, status_label, virtual_id):
            total_price = Decimal("0.0")
            cart_items_out = []
            for item in items:
                sku = item.color_sku
                if sku and sku.product_model:
                    price_per_meter = Decimal(str(sku.specific_price if sku.specific_price is not None else sku.product_model.base_price))
                else:
                    price_per_meter = Decimal('0.0')
                
                line_total = price_per_meter * Decimal(str(item.length_meters)) * Decimal(str(item.units))
                total_price += line_total
                
                cart_items_out.append({
                    "id": -item.id,
                    "length_meters": item.length_meters,
                    "units": item.units,
                    "price_at_purchase": price_per_meter,
                    "historical_product_name": sku.product_model.name if sku and sku.product_model else None,
                    "historical_color_name": sku.color_name if sku else None,
                    "color_sku": sku
                })
                
            return {
                "id": virtual_id,
                "status": status_label,
                "total_price": total_price,
                "created_at": cart.updated_at,
                "items": cart_items_out
            }

        if pending_items:
            result.append(_build_virtual_order(pending_items, "cart", -1))
        
    result.extend(orders)
    return result


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
    # Exclude "archived" orders
    order_stmt = (
        select(Order)
        .where(Order.user_id.in_(user_ids))
        .where(Order.status != "archived")
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

            price_per_meter = Decimal(str(item.price_at_purchase)) if item.price_at_purchase else Decimal('0')
            line_total = price_per_meter * Decimal(str(item.length_meters)) * Decimal(str(item.units))

            pm = item.color_sku.product_model if item.color_sku else None
            customer_data[uid]['items'].append({
                'product_name': pm.name if pm else 'לא ידוע',
                'color_name': item.color_sku.color_name if item.color_sku else 'לא ידוע',
                'category': pm.product_type.name if pm and pm.product_type else 'ללא קטגוריה',
                'sku': item.color_sku.sku if item.color_sku else None,
                'length_meters': Decimal(str(item.length_meters)),
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
                price_per_meter = Decimal(str(sku.specific_price if sku.specific_price is not None else sku.product_model.base_price))
            else:
                price_per_meter = Decimal('0')
            line_total = price_per_meter * Decimal(str(item.length_meters)) * Decimal(str(item.units))

            pm = sku.product_model if sku else None
            customer_data[uid]['items'].append({
                'product_name': pm.name if pm else 'לא ידוע',
                'color_name': sku.color_name if sku else 'לא ידוע',
                'category': pm.product_type.name if pm and pm.product_type else 'ללא קטגוריה',
                'sku': sku.sku if sku else None,
                'length_meters': Decimal(str(item.length_meters)),
                'units': item.units,
                'price': round(line_total, 2),
                'status': 'cart'
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
            'total': cust['total']
        })

    return result

async def create_season_archive(db: AsyncSession, archive_in: schemas.SeasonArchiveCreate):
    from app.domains.admin.models import SeasonArchive
    # Create the new archive
    new_archive = SeasonArchive(
        season_name=archive_in.season_name,
        archive_data=archive_in.archive_data
    )
    db.add(new_archive)
    await db.commit()
    
    # Check limit and delete oldest if count > 3
    res = await db.execute(select(SeasonArchive).order_by(SeasonArchive.created_at.desc()))
    archives = res.scalars().all()
    
    if len(archives) > 3:
        for old_arch in archives[3:]:
            await db.delete(old_arch)
        await db.commit()
        
    await db.refresh(new_archive)
    return new_archive

async def get_all_season_archives(db: AsyncSession):
    from app.domains.admin.models import SeasonArchive
    res = await db.execute(select(SeasonArchive).order_by(SeasonArchive.created_at.desc()))
    return res.scalars().all()

async def get_season_archive(db: AsyncSession, archive_id: int):
    from app.domains.admin.models import SeasonArchive
    res = await db.execute(select(SeasonArchive).where(SeasonArchive.id == archive_id))
    return res.scalars().first()

async def get_season_stats(db: AsyncSession):
    from sqlalchemy import select, func
    from app.domains.orders.models import Order, OrderItem, CartItem
    from app.domains.products.models import ColorSKU, ProductModel, ProductType

    # 1. Orders Overview
    overview_stmt = select(
        func.sum(OrderItem.length_meters * OrderItem.units).label("total_meters"),
        func.sum(OrderItem.price_at_purchase * OrderItem.length_meters * OrderItem.units).label("total_revenue"),
        func.sum(OrderItem.units).label("total_items")
    ).select_from(OrderItem).join(Order).where(Order.status.in_(["order_unpaid", "order_paid", "cutting_unpaid", "cutting_paid"]))
    
    overview_res = await db.execute(overview_stmt)
    overview_row = overview_res.first()

    total_meters = Decimal(str(overview_row.total_meters)) if overview_row and overview_row.total_meters else Decimal('0.0')
    total_revenue = Decimal(str(overview_row.total_revenue)) if overview_row and overview_row.total_revenue else Decimal('0.0')
    total_items = int((overview_row.total_items or 0) if overview_row else 0)

    # 3. Orders Items
    items_stmt = select(
        ColorSKU.id.label("sku_id"),
        ProductModel.name.label("product_name"),
        ColorSKU.color_name,
        ProductType.name.label("category"),
        ColorSKU.sku,
        func.sum(OrderItem.length_meters * OrderItem.units).label("total_meters"),
        func.sum(OrderItem.price_at_purchase * OrderItem.length_meters * OrderItem.units).label("total_revenue"),
        func.count(Order.id.distinct()).label("total_orders")
    ).select_from(OrderItem).join(Order).join(
        ColorSKU, OrderItem.color_sku_id == ColorSKU.id, isouter=True
    ).join(
        ProductModel, ColorSKU.product_model_id == ProductModel.id, isouter=True
    ).join(
        ProductType, ProductModel.product_type_id == ProductType.id, isouter=True
    ).where(Order.status.in_(["order_unpaid", "order_paid", "cutting_unpaid", "cutting_paid"])).group_by(
        ColorSKU.id, ProductModel.id, ProductType.id
    )
    items_res = await db.execute(items_stmt)

    
    # Merge items stats
    merged_items = {}
    
    def merge_row(row):
        key = row.sku_id if row.sku_id else f"{row.product_name}-{row.color_name}"
        if key not in merged_items:
            merged_items[key] = {
                "product_name": row.product_name or "מוצר שנמחק",
                "color_name": row.color_name or "צבע שנמחק",
                "category": row.category or "לא ידוע",
                "sku": row.sku,
                "total_meters": Decimal('0.0'),
                "total_revenue": Decimal('0.0'),
                "total_orders": 0
            }
        
        merged_items[key]["total_meters"] += Decimal(str(row.total_meters)) if row.total_meters else Decimal('0.0')
        merged_items[key]["total_revenue"] += Decimal(str(row.total_revenue)) if row.total_revenue else Decimal('0.0')
        merged_items[key]["total_orders"] += int(row.total_orders or 0)

    for row in items_res.all():
        merge_row(row)

    return {
        "total_meters": total_meters,
        "total_revenue": total_revenue,
        "total_items": total_items,
        "items_stats": list(merged_items.values())
    }

async def reset_season(db: AsyncSession, season_name: str):
    import os
    import shutil
    from sqlalchemy import select, delete, update
    from app.domains.admin.models import SeasonArchive
    from app.domains.orders.models import CartItem, Order
    from app.domains.products.models import ProductType, ColorSKU
    import app.domains.admin.services as admin_services

    from fastapi.encoders import jsonable_encoder

    # 1. Create season archive
    stats = await admin_services.get_season_stats(db)
    archive_data = jsonable_encoder(stats)
    
    new_archive = SeasonArchive(
        season_name=season_name,
        archive_data=archive_data
    )
    db.add(new_archive)

    # 2. Truncate cart_items
    await db.execute(delete(CartItem))

    # 3. Delete physical images
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    if os.path.exists(upload_dir):
        # We delete all contents of uploads directory
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                pass # Ignore errors, we want to clear as much as possible

    # 4. Delete all ProductType (cascades to ProductModel and ColorSKU)
    await db.execute(delete(ProductType))

    # 5. Archive open orders
    await db.execute(
        update(Order)
        .where(Order.status.in_(["order_unpaid", "order_paid", "cutting_unpaid", "cutting_paid"]))
        .values(status="archived")
    )

    await db.commit()
    await _invalidate_catalog()
    return True

async def archive_season_orders(db: AsyncSession, season_name: str):
    import app.domains.admin.services as admin_services
    from app.domains.admin.models import SeasonArchive
    from app.domains.orders.models import Order
    from sqlalchemy import update
    from fastapi.encoders import jsonable_encoder
    
    # 1. Create season archive document
    stats = await admin_services.get_season_stats(db)
    archive_data = jsonable_encoder(stats)
    
    new_archive = SeasonArchive(
        season_name=season_name,
        archive_data=archive_data
    )
    db.add(new_archive)
    
    # 2. Archive orders
    await db.execute(
        update(Order)
        .where(Order.status.in_(["order_unpaid", "order_paid", "cutting_unpaid", "cutting_paid"]))
        .values(status="archived")
    )
    
    await db.commit()
    return True
from sqlalchemy import func

async def _get_max_order(db: AsyncSession, model_class, **filters):
    stmt = select(func.max(model_class.display_order))
    for k, v in filters.items():
        stmt = stmt.where(getattr(model_class, k) == v)
    result = await db.execute(stmt)
    max_order = result.scalar()
    return max_order or 0

async def reorder_item(db: AsyncSession, model_class, item_id: int, direction: str, **group_filters):
    # Fetch all items in the same group ordered by display_order then id
    group_stmt = select(model_class)
    for k, v in group_filters.items():
        group_stmt = group_stmt.where(getattr(model_class, k) == v)
    group_stmt = group_stmt.order_by(model_class.display_order.asc(), model_class.id.asc())
    
    items = list((await db.execute(group_stmt)).scalars().all())
    
    # Normalize display_order to ensure clean 0, 1, 2, 3 sequence
    for i, item in enumerate(items):
        item.display_order = i
    
    target_idx = next((i for i, item in enumerate(items) if item.id == item_id), -1)
    if target_idx == -1:
        return False
        
    swap_idx = target_idx - 1 if direction == "up" else target_idx + 1
    
    if 0 <= swap_idx < len(items):
        # Swap display_order
        temp = items[target_idx].display_order
        items[target_idx].display_order = items[swap_idx].display_order
        items[swap_idx].display_order = temp
        
        await db.commit()
        await _invalidate_catalog()
        return True
    
    await db.commit() # Just save the normalization if no swap happened
    await _invalidate_catalog()
    return True # Return true even if out of bounds to avoid 400 Bad Request on double-clicks

import httpx
from fastapi import HTTPException, UploadFile
from app.core.config import settings
from app.core.http_client import http_client

async def get_wistia_videos_list() -> list:
    token = settings.WISTIA_API_TOKEN
    if not token:
        raise HTTPException(status_code=500, detail="Wistia API token is missing in server environment.")
    
    url = "https://api.wistia.com/v1/medias.json"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = await http_client.get(url, headers=headers, timeout=15.0)
        response.raise_for_status()
        
        medias = response.json()
        videos = []
        for m in medias:
            if m.get("type") == "Video":
                videos.append({
                    "hashed_id": m.get("hashed_id"),
                    "name": m.get("name"),
                    "duration": m.get("duration", 0),
                    "thumbnail_url": m.get("thumbnail", {}).get("url")
                })
        return videos
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Wistia API connection error: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch videos from Wistia: {e.response.text}")

async def delete_wistia_video(hashed_id: str) -> dict:
    token = settings.WISTIA_API_TOKEN
    if not token:
        raise HTTPException(status_code=500, detail="Wistia API token is missing in server environment.")
    
    url = f"https://api.wistia.com/v1/medias/{hashed_id}.json"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = await http_client.delete(url, headers=headers, timeout=15.0)
        if response.status_code not in (200, 204):
            raise HTTPException(status_code=response.status_code, detail=f"Failed to delete video from Wistia: {response.text}")
        return {"msg": "Video deleted"}
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Wistia API connection error: {str(e)}")


async def upload_video_to_wistia(file: UploadFile) -> dict:
    token = settings.WISTIA_API_TOKEN
    if not token:
        raise HTTPException(status_code=500, detail="Wistia API token is missing in server environment.")
    
    url = "https://upload.wistia.com"
    file_content = await file.read()
    
    files = {
        'file': (file.filename, file_content, file.content_type)
    }
    data = {
        'api_password': token
    }
    
    try:
        response = await http_client.post(url, files=files, data=data, timeout=300.0)
        response.raise_for_status()
            
        res_data = response.json()
        return {
            "hashed_id": res_data.get("hashed_id"),
            "name": res_data.get("name"),
            "duration": res_data.get("duration", 0),
            "thumbnail_url": res_data.get("thumbnail", {}).get("url")
        }
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Wistia Upload API connection error: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Wistia upload failed: {e.response.text}")

