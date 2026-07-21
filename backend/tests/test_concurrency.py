import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.db.database import get_db
from app.main import app
from app.domains.users.models import Region, User
from app.domains.products.models import ProductModel, ProductType, ColorSKU
from app.domains.orders.models import Cart, CartItem
from app.core.security import get_password_hash

@pytest.mark.asyncio
async def test_race_condition_stock_allocation(engine_test):
    """
    Test Rule #5: Race Conditions / Stock Allocation.
    Simulates two different users trying to checkout an item simultaneously
    where the combined requested amount exceeds the available stock.
    Only one should succeed, and the other should fail gracefully.
    The stock must never drop below 0.
    """
    
    # We need separate sessions for setup and for each concurrent request
    from sqlalchemy.orm import sessionmaker
    async_session_maker = sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)
    
    # 1. Setup Database using a setup session
    async with async_session_maker() as setup_session:
        region = Region(name="RaceRegion", shipping_cost=Decimal("10.00"), delivery_days=2)
        setup_session.add(region)
        await setup_session.commit()
        await setup_session.refresh(region)

        user1 = User(
            email="user1@bingo.online",
            hashed_password=get_password_hash("pass123"),
            first_name="User",
            last_name="One",
            region_id=region.id,
            is_active=True
        )
        user2 = User(
            email="user2@bingo.online",
            hashed_password=get_password_hash("pass123"),
            first_name="User",
            last_name="Two",
            region_id=region.id,
            is_active=True
        )
        setup_session.add_all([user1, user2])
        await setup_session.commit()
        await setup_session.refresh(user1)
        await setup_session.refresh(user2)

        ptype = ProductType(name="RaceType")
        setup_session.add(ptype)
        await setup_session.commit()
        await setup_session.refresh(ptype)

        model = ProductModel(name="RaceModel", product_type_id=ptype.id, base_price=Decimal("100.00"))
        setup_session.add(model)
        await setup_session.commit()
        await setup_session.refresh(model)

        # CRITICAL: We only have exactly 5.00 meters in stock
        sku = ColorSKU(product_model_id=model.id, color_name="RaceColor", stock_meters=Decimal("5.00"))
        setup_session.add(sku)
        await setup_session.commit()
        await setup_session.refresh(sku)

        # Add 4.0 meters to User 1's cart
        cart1 = Cart(user_id=user1.id)
        setup_session.add(cart1)
        await setup_session.commit()
        await setup_session.refresh(cart1)
        cart_item1 = CartItem(cart_id=cart1.id, color_sku_id=sku.id, length_meters=Decimal("4.00"), units=1)
        setup_session.add(cart_item1)

        # Add 4.0 meters to User 2's cart
        cart2 = Cart(user_id=user2.id)
        setup_session.add(cart2)
        await setup_session.commit()
        await setup_session.refresh(cart2)
        cart_item2 = CartItem(cart_id=cart2.id, color_sku_id=sku.id, length_meters=Decimal("4.00"), units=1)
        setup_session.add(cart_item2)

        await setup_session.commit()
        
        # Keep IDs for assertions later
        sku_id = sku.id

    # Override get_db to return a NEW session each time to simulate actual concurrent isolated requests
    async def override_get_db():
        async with async_session_maker() as session:
            yield session
    app.dependency_overrides[get_db] = override_get_db

    # 2. Login to get tokens
    # We create isolated clients for each user to simulate parallel requests
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://testserver") as client1, \
                   AsyncClient(transport=transport, base_url="http://testserver") as client2:
            
            res1 = await client1.post("/api/v1/users/login", data={"username": "user1@bingo.online", "password": "pass123"})
            res2 = await client2.post("/api/v1/users/login", data={"username": "user2@bingo.online", "password": "pass123"})
            
            token1 = res1.json()["access_token"]
            token2 = res2.json()["access_token"]

            # 3. Simulate Race Condition: Both hit /checkout at the EXACT SAME TIME
            # Since we only have 5 meters total, and each wants 4 meters, 
            # one MUST succeed and the other MUST fail.
            
            headers1 = {"Authorization": f"Bearer {token1}"}
            headers2 = {"Authorization": f"Bearer {token2}"}

            # Fire requests simultaneously using asyncio.gather
            checkout_req1 = client1.post("/api/v1/orders/checkout", headers=headers1)
            checkout_req2 = client2.post("/api/v1/orders/checkout", headers=headers2)
            
            response1, response2 = await asyncio.gather(checkout_req1, checkout_req2)

            # 4. Assertions
            status_codes = [response1.status_code, response2.status_code]
            
            # We expect exactly one 200 (Success) and exactly one 400 (Failure - out of stock)
            # If both are 200, we have a catastrophic Race Condition bug!
            assert status_codes.count(200) == 1, "Race Condition Failure! Both users successfully checked out!"
            assert status_codes.count(400) == 1, "Expected one request to gracefully fail with 400 Out of Stock."
            
            # Verify the database stock is not negative
            async with async_session_maker() as verify_session:
                verify_sku = (await verify_session.execute(select(ColorSKU).where(ColorSKU.id == sku_id))).scalars().first()
                # Remaining stock should be 5.0 - 4.0 = 1.0
                assert float(verify_sku.stock_meters) == 1.0, "Stock calculation error after concurrent checkout."
    finally:
        app.dependency_overrides.clear()
