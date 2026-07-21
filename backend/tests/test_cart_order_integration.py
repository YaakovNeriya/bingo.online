import pytest
from httpx import AsyncClient
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domains.users.models import Region, User
from app.domains.products.models import ProductModel, ProductType, ColorSKU
from app.domains.orders.models import Order, OrderItem, Cart, CartItem
from app.core.security import get_password_hash

@pytest.mark.asyncio
async def test_full_cart_order_integration(client: AsyncClient, db_session: AsyncSession):
    """
    Simulates a full realistic scenario:
    - Active site with categories, models, colors, and images.
    - A user with items in a Cart (unchecked/not sent yet).
    - An active Order with OrderItems (checked/sent already).
    - Verifies the /api/v1/orders/cart endpoint returns the unified view accurately.
    - Adds a new item to the active order, simulating Auto-Add, and validates.
    """
    
    # --- 1. Populate Database ---
    
    # Region and User
    region = Region(name="Global", shipping_cost=Decimal("35.00"), delivery_days=5)
    db_session.add(region)
    await db_session.commit()
    await db_session.refresh(region)

    user = User(
        email="integration@bingo.online",
        hashed_password=get_password_hash("password123"),
        first_name="Integration",
        last_name="Tester",
        phone="0500000000",
        region_id=region.id,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Categories (ProductType)
    ptype1 = ProductType(name="Summer Collection")
    ptype2 = ProductType(name="Winter Collection")
    db_session.add_all([ptype1, ptype2])
    await db_session.commit()
    await db_session.refresh(ptype1)
    await db_session.refresh(ptype2)

    # Models (ProductModel)
    model1 = ProductModel(
        name="Cotton Breeze",
        product_type_id=ptype1.id,
        base_price=Decimal("45.00"),
        fabric_height=Decimal("1.50")
    )
    model2 = ProductModel(
        name="Woolen Warmth",
        product_type_id=ptype2.id,
        base_price=Decimal("80.00"),
        fabric_height=Decimal("1.40")
    )
    db_session.add_all([model1, model2])
    await db_session.commit()
    await db_session.refresh(model1)
    await db_session.refresh(model2)

    # Images are stored in ColorSKU directly as JSON arrays
    # Colors (ColorSKU)
    sku1_blue = ColorSKU(product_model_id=model1.id, color_name="Blue", stock_meters=Decimal("100.00"), is_active=True, image_urls=["http://example.com/img1.jpg"])
    sku1_red = ColorSKU(product_model_id=model1.id, color_name="Red", stock_meters=Decimal("100.00"), is_active=True, image_urls=[])
    sku2_black = ColorSKU(product_model_id=model2.id, color_name="Black", stock_meters=Decimal("50.00"), is_active=True, image_urls=["http://example.com/img2.jpg"])
    db_session.add_all([sku1_blue, sku1_red, sku2_black])
    await db_session.commit()
    await db_session.refresh(sku1_blue)
    await db_session.refresh(sku1_red)
    await db_session.refresh(sku2_black)

    # --- 2. Setup Cart & Order State ---
    
    # Active Order (Checked/Sent items)
    # The user has already sent 1 item (sku1_blue)
    order = Order(
        user_id=user.id,
        status="order_unpaid",
        total_price=Decimal("35.00") + (Decimal("45.00") * 2) # shipping + 2 units of 1m
    )
    db_session.add(order)
    await db_session.commit()
    await db_session.refresh(order)

    order_item = OrderItem(
        order_id=order.id,
        color_sku_id=sku1_blue.id,
        length_meters=Decimal("1.00"),
        units=2,
        price_at_purchase=Decimal("45.00"),
        historical_product_name="Cotton Breeze",
        historical_color_name="Blue"
    )
    db_session.add(order_item)
    
    # Deduct stock for the ordered item (2m)
    sku1_blue.stock_meters -= Decimal("2.00")
    
    # Cart (Unchecked/Not sent yet)
    # The user added sku2_black but hasn't checked the box yet
    cart = Cart(user_id=user.id)
    db_session.add(cart)
    await db_session.commit()
    await db_session.refresh(cart)

    cart_item = CartItem(
        cart_id=cart.id,
        color_sku_id=sku2_black.id,
        length_meters=Decimal("2.50"),
        units=1
    )
    db_session.add(cart_item)
    await db_session.commit()

    # --- 3. Run Integration Tests (API) ---

    # Login
    login_response = await client.post(
        "/api/v1/users/login",
        data={"username": "integration@bingo.online", "password": "password123"}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify Cart Endpoint Returns CartOut State
    cart_res = await client.get("/api/v1/orders/cart", headers=headers)
    assert cart_res.status_code == 200
    cart_data = cart_res.json()
    
    # Verify the items in cart (Unchecked)
    assert len(cart_data["items"]) == 1
    assert cart_data["items"][0]["color_sku"]["id"] == sku2_black.id
    # Verify image relations in the response
    assert cart_data["items"][0]["color_sku"]["image_urls"][0] == "http://example.com/img2.jpg"
    
    # Verify Active Order Endpoint
    order_res = await client.get("/api/v1/orders/active", headers=headers)
    assert order_res.status_code == 200
    order_data = order_res.json()

    # Verify the items in active order (Checked)
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["color_sku"]["id"] == sku1_blue.id
    assert order_data["total_price"] == "125.00"

    # Auto-Add Test: User adds a new item (sku1_red) from catalog
    # Because there's an active order, it should go directly to the active order
    payload = {"color_sku_id": sku1_red.id, "length_meters": 1.0, "units": 1}
    add_res = await client.post("/api/v1/orders/cart", json=payload, headers=headers)
    assert add_res.status_code == 200
    add_data = add_res.json()
    
    # After auto-add, the order should now have 2 items
    assert len(add_data["active_order"]["items"]) == 2
    # The cart should still only have 1 item (the black one)
    assert len(add_data["cart"]["items"]) == 1
    
    # Order total price should increase by 45
    assert add_data["active_order"]["total_price"] == "170.00"
    
    # Stock should be automatically deducted for the new auto-add item
    await db_session.refresh(sku1_red)
    assert float(sku1_red.stock_meters) == 99.00
