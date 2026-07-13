import pytest
import asyncio
from decimal import Decimal
from app.domains.admin.services import get_season_stats
from app.domains.users.models import User
from app.domains.products.models import ProductType, ProductModel, ColorSKU
from app.domains.orders.models import Order, OrderItem

@pytest.mark.asyncio
async def test_get_season_stats_logic(db_session):
    # 1. Create User
    user = User(email="test@example.com", hashed_password="123", first_name="Test")
    db_session.add(user)
    await db_session.commit()

    # 2. Create Product Hierarchy
    pt = ProductType(name="Cotton")
    db_session.add(pt)
    await db_session.commit()
    await db_session.refresh(pt)

    pm = ProductModel(name="Premium Cotton", product_type_id=pt.id, base_price=Decimal("10.00"), fabric_height=Decimal("1.5"))
    db_session.add(pm)
    await db_session.commit()
    await db_session.refresh(pm)

    sku1 = ColorSKU(sku="COT-RED", color_name="Red", product_model_id=pm.id, stock_meters=Decimal("100"))
    sku2 = ColorSKU(sku="COT-BLU", color_name="Blue", product_model_id=pm.id, stock_meters=Decimal("100"))
    db_session.add_all([sku1, sku2])
    await db_session.commit()
    await db_session.refresh(sku1)
    await db_session.refresh(sku2)

    # 3. Create Orders (Only Received and Shipped should count)
    
    # Order 1: order_unpaid -> Should count
    o1 = Order(user_id=user.id, status="order_unpaid", total_price=Decimal("100.00"))
    db_session.add(o1)
    await db_session.commit()
    await db_session.refresh(o1)
    oi1 = OrderItem(order_id=o1.id, color_sku_id=sku1.id, length_meters=Decimal("5.00"), units=2, price_at_purchase=Decimal("10.00")) # 5 * 2 = 10 meters, 10 * 10 = 100 revenue
    db_session.add(oi1)

    # Order 2: order_paid -> Should count
    o2 = Order(user_id=user.id, status="order_paid", total_price=Decimal("45.00"))
    db_session.add(o2)
    await db_session.commit()
    await db_session.refresh(o2)
    oi2 = OrderItem(order_id=o2.id, color_sku_id=sku2.id, length_meters=Decimal("3.00"), units=1, price_at_purchase=Decimal("15.00")) # 3 * 1 = 3 meters, 3 * 15 = 45 revenue
    db_session.add(oi2)

    # Order 3: cart (virtual) / pending -> Should NOT count
    o3 = Order(user_id=user.id, status="cart", total_price=Decimal("1000.00"))
    db_session.add(o3)
    await db_session.commit()
    await db_session.refresh(o3)
    oi3 = OrderItem(order_id=o3.id, color_sku_id=sku1.id, length_meters=Decimal("100.00"), units=1, price_at_purchase=Decimal("10.00"))
    db_session.add(oi3)

    await db_session.commit()

    # 4. Execute Service function
    stats = await get_season_stats(db_session)

    # 5. Assertions
    # Total meters = (5 * 2) + (3 * 1) = 13
    assert stats["total_meters"] == 13.0
    # Total revenue = (100) + (45) = 145
    assert stats["total_revenue"] == 145.0
    # Total items = 2 + 1 = 3
    assert stats["total_items"] == 3

    assert len(stats["items_stats"]) == 2

    # Check Red SKU stats
    red_stats = next(s for s in stats["items_stats"] if s["color_name"] == "Red")
    assert red_stats["total_meters"] == 10.0
    assert red_stats["total_revenue"] == 100.0
    assert red_stats["total_orders"] == 1

    # Check Blue SKU stats
    blue_stats = next(s for s in stats["items_stats"] if s["color_name"] == "Blue")
    assert blue_stats["total_meters"] == 3.0
    assert blue_stats["total_revenue"] == 45.0
    assert blue_stats["total_orders"] == 1

@pytest.mark.asyncio
async def test_season_reset_json_serialization(db_session):
    from app.domains.admin.services import reset_season
    from app.domains.admin.models import SeasonArchive
    from sqlalchemy import select
    import os
    
    # Run the reset logic
    # This will generate season stats (empty or from previous test state) 
    # and attempt to insert into SeasonArchive with a JSON column.
    # If jsonable_encoder is missing, this will throw TypeError for Decimal serialization.
    res = await reset_season(db_session, "Test Season Serialization")
    assert res is True
    
    # Verify the archive was created and saved correctly as JSON
    archive = (await db_session.execute(select(SeasonArchive).where(SeasonArchive.season_name == "Test Season Serialization"))).scalars().first()
    assert archive is not None
    assert isinstance(archive.archive_data, dict)
    assert "total_meters" in archive.archive_data
