import pytest
from httpx import AsyncClient
from decimal import Decimal

@pytest.mark.asyncio
async def test_cart_negative_quantities(client: AsyncClient, db_session):
    # Setup user
    from app.domains.users.models import Region, User
    from app.core.security import get_password_hash
    from app.domains.products.models import ProductModel, ColorSKU

    region = Region(name="Center", shipping_cost=20, delivery_days=3)
    db_session.add(region)
    await db_session.commit()
    await db_session.refresh(region)

    user = User(
        email="hacker@bingo.online",
        hashed_password=get_password_hash("password123"),
        first_name="Hacker",
        last_name="Man",
        phone="0501234567",
        region_id=region.id,
        is_active=True
    )
    db_session.add(user)
    
    # Setup product
    from app.domains.products.models import ProductType
    ptype = ProductType(name="Cotton Category")
    db_session.add(ptype)
    await db_session.commit()
    await db_session.refresh(ptype)

    product = ProductModel(
        name="Premium Cotton",
        product_type_id=ptype.id,
        base_price=Decimal("50.00"),
        fabric_height=Decimal("1.50")
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    sku = ColorSKU(
        product_model_id=product.id,
        color_name="Black",
        stock_meters=Decimal("100.00"),
        is_active=True
    )
    db_session.add(sku)
    await db_session.commit()
    await db_session.refresh(sku)

    # Login
    response = await client.post(
        "/api/v1/users/login",
        data={"username": "hacker@bingo.online", "password": "password123"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to add negative quantity
    payload = {
        "color_sku_id": sku.id,
        "length_meters": -5.0,  # Negative
        "units": 1
    }
    res = await client.post("/api/v1/orders/cart", json=payload, headers=headers)
    assert res.status_code == 422  # Unprocessable Entity (Pydantic validation)
    
    # Attempt to add zero units
    payload = {
        "color_sku_id": sku.id,
        "length_meters": 5.0,
        "units": 0  # Zero
    }
    res = await client.post("/api/v1/orders/cart", json=payload, headers=headers)
    assert res.status_code == 422 
    
    # Valid addition
    payload = {
        "color_sku_id": sku.id,
        "length_meters": 10.0,
        "units": 1
    }
    res = await client.post("/api/v1/orders/cart", json=payload, headers=headers)
    assert res.status_code == 200

    # 6. Fetch cart to get item IDs
    cart_res = await client.get("/api/v1/orders/cart", headers=headers)
    cart_data = cart_res.json()
    item_ids = [item["id"] for item in cart_data["items"]]

    # Checkout successful
    res = await client.post("/api/v1/orders/checkout", json={"selected_item_ids": item_ids}, headers=headers)
    assert res.status_code == 200
    
    # Verify inventory was deducted transactionally
    await db_session.refresh(sku)
    assert sku.stock_meters == Decimal("90.00")

@pytest.mark.asyncio
async def test_order_price_calculation(client: AsyncClient, db_session):
    from app.domains.users.models import Region, User
    from app.core.security import get_password_hash
    from app.domains.products.models import ProductModel, ColorSKU, ProductType

    # 1. Setup Region (shipping = 35)
    region = Region(name="North", shipping_cost=Decimal("35.00"), delivery_days=3)
    db_session.add(region)
    await db_session.commit()
    await db_session.refresh(region)

    # 2. Setup User
    user = User(
        email="buyer@bingo.online",
        hashed_password=get_password_hash("password123"),
        first_name="Buyer",
        last_name="Test",
        phone="0500000000",
        region_id=region.id,
        is_active=True
    )
    db_session.add(user)
    
    # 3. Setup Products
    ptype = ProductType(name="Test Category")
    db_session.add(ptype)
    await db_session.commit()
    await db_session.refresh(ptype)

    product1 = ProductModel(
        name="Fabric A",
        product_type_id=ptype.id,
        base_price=Decimal("40.00"),  # price: 40/meter
        fabric_height=Decimal("1.50")
    )
    product2 = ProductModel(
        name="Fabric B",
        product_type_id=ptype.id,
        base_price=Decimal("100.00"), # price: 100/meter
        fabric_height=Decimal("1.50")
    )
    db_session.add_all([product1, product2])
    await db_session.commit()
    await db_session.refresh(product1)
    await db_session.refresh(product2)

    sku1 = ColorSKU(
        product_model_id=product1.id,
        color_name="Red",
        stock_meters=Decimal("100.00"),
        is_active=True,
        specific_price=Decimal("45.00") # Override base_price (45 instead of 40)
    )
    sku2 = ColorSKU(
        product_model_id=product2.id,
        color_name="Blue",
        stock_meters=Decimal("100.00"),
        is_active=True
    )
    db_session.add_all([sku1, sku2])
    await db_session.commit()
    await db_session.refresh(sku1)
    await db_session.refresh(sku2)

    # 4. Login
    response = await client.post(
        "/api/v1/users/login",
        data={"username": "buyer@bingo.online", "password": "password123"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 5. Add to cart
    # Item 1: 2.5 meters * 2 units = 5 meters total. Price = 45 * 5 = 225
    payload1 = {"color_sku_id": sku1.id, "length_meters": 2.5, "units": 2}
    await client.post("/api/v1/orders/cart", json=payload1, headers=headers)

    # Item 2: 1.0 meters * 1 unit = 1 meter total. Price = 100 * 1 = 100
    payload2 = {"color_sku_id": sku2.id, "length_meters": 1.0, "units": 1}
    await client.post("/api/v1/orders/cart", json=payload2, headers=headers)

    # 6. Fetch cart to get item IDs
    cart_res = await client.get("/api/v1/orders/cart", headers=headers)
    cart_data = cart_res.json()
    item_ids = [item["id"] for item in cart_data["items"]]

    # 7. Checkout
    checkout_payload = {"selected_item_ids": item_ids}
    res = await client.post("/api/v1/orders/checkout", json=checkout_payload, headers=headers)
    if res.status_code != 200:
        print("Checkout failed:", res.json())
    assert res.status_code == 200
    order_data = res.json()

    # Total expected price = 225 (Item 1) + 100 (Item 2) + 35 (Shipping) = 360
    assert order_data["total_price"] == "360.00"
    
    # Check individual order items
    assert len(order_data["items"]) == 2
    for item in order_data["items"]:
        if item["color_sku_id"] == sku1.id:
            assert item["price_at_purchase"] == "45.00"
        elif item["color_sku_id"] == sku2.id:
            assert item["price_at_purchase"] == "100.00"

@pytest.mark.asyncio
async def test_toggle_item_returns_new_cart_id(client: AsyncClient, db_session):
    from app.domains.users.models import Region, User
    from app.core.security import get_password_hash
    from app.domains.products.models import ProductModel, ColorSKU, ProductType
    
    # 1. Setup
    region = Region(name="South", shipping_cost=Decimal("10.00"), delivery_days=2)
    db_session.add(region)
    await db_session.commit()
    await db_session.refresh(region)

    user = User(
        email="toggle@bingo.online",
        hashed_password=get_password_hash("password123"),
        first_name="Toggle",
        last_name="Tester",
        phone="0501112223",
        region_id=region.id,
        is_active=True
    )
    db_session.add(user)
    
    ptype = ProductType(name="Toggle Category")
    db_session.add(ptype)
    await db_session.commit()
    await db_session.refresh(ptype)

    product = ProductModel(
        name="Toggle Fabric",
        product_type_id=ptype.id,
        base_price=Decimal("50.00"),
        fabric_height=Decimal("1.50")
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    sku = ColorSKU(
        product_model_id=product.id,
        color_name="Green",
        stock_meters=Decimal("100.00"),
        is_active=True
    )
    db_session.add(sku)
    await db_session.commit()
    await db_session.refresh(sku)

    # 2. Login
    response = await client.post(
        "/api/v1/users/login",
        data={"username": "toggle@bingo.online", "password": "password123"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Add to cart
    payload = {"color_sku_id": sku.id, "length_meters": 5.0, "units": 1}
    await client.post("/api/v1/orders/cart", json=payload, headers=headers)
    
    cart_res = await client.get("/api/v1/orders/cart", headers=headers)
    item_ids = [item["id"] for item in cart_res.json()["items"]]

    # 4. Checkout to move to active order
    checkout_res = await client.post("/api/v1/orders/checkout", json={"selected_item_ids": item_ids}, headers=headers)
    assert checkout_res.status_code == 200
    
    order_data = checkout_res.json()
    order_item_id = order_data["items"][0]["id"]
    
    # Verify stock was deducted (100 - 5 = 95)
    await db_session.refresh(sku)
    assert sku.stock_meters == Decimal("95.00")

    # 5. Remove item from active order (simulate toggling off checkbox)
    remove_res = await client.post(f"/api/v1/orders/active/items/{order_item_id}/remove", headers=headers)
    assert remove_res.status_code == 200
    remove_data = remove_res.json()
    assert "cart" in remove_data
    assert "new_cart_item_id" in remove_data
    assert isinstance(remove_data["new_cart_item_id"], int)
    
    # 6. Verify stock was restored
    await db_session.refresh(sku)
    assert sku.stock_meters == Decimal("100.00")
    
    # 7. Verify the new cart item actually exists in the cart
    db_session.expire_all()
    cart_check_res = await client.get("/api/v1/orders/cart", headers=headers)
    cart_check_data = cart_check_res.json()
    assert len(cart_check_data["items"]) == 1
    assert cart_check_data["items"][0]["id"] == remove_data["new_cart_item_id"]

@pytest.mark.asyncio
async def test_deadline_blocks_cart_operations(client: AsyncClient, db_session):
    from app.domains.users.models import Region, User
    from app.core.security import get_password_hash
    from app.domains.products.models import ProductModel, ColorSKU, ProductType
    from datetime import datetime, timedelta, timezone
    
    # 1. Setup Region and User with a passed deadline
    past_deadline = datetime.now(timezone.utc) - timedelta(days=1)
    
    region = Region(name="Deadline Test", shipping_cost=Decimal("10.00"), delivery_days=2, deadline_date=past_deadline)
    db_session.add(region)
    await db_session.commit()
    await db_session.refresh(region)
    
    user = User(
        email="deadline@bingo.online",
        hashed_password=get_password_hash("password123"),
        first_name="Late",
        last_name="Buyer",
        phone="0509998887",
        region_id=region.id,
        is_active=True
    )
    db_session.add(user)
    
    # Setup Product
    ptype = ProductType(name="Deadline Category")
    db_session.add(ptype)
    await db_session.commit()
    await db_session.refresh(ptype)

    product = ProductModel(
        name="Deadline Fabric",
        product_type_id=ptype.id,
        base_price=Decimal("50.00"),
        fabric_height=Decimal("1.50")
    )
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)

    sku = ColorSKU(
        product_model_id=product.id,
        color_name="Yellow",
        stock_meters=Decimal("100.00"),
        is_active=True
    )
    db_session.add(sku)
    await db_session.commit()
    await db_session.refresh(sku)

    # 2. Login
    response = await client.post(
        "/api/v1/users/login",
        data={"username": "deadline@bingo.online", "password": "password123"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Attempt to add to cart
    payload = {"color_sku_id": sku.id, "length_meters": 5.0, "units": 1}
    add_res = await client.post("/api/v1/orders/cart", json=payload, headers=headers)
    
    # 4. Verify blocked by deadline
    assert add_res.status_code == 403
    assert "חלון ההזמנות לעונה זו נסגר" in add_res.json()["detail"]
