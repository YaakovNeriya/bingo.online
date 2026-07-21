import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domains.users.models import Region, User
from app.domains.products.models import ProductModel, ProductType, ColorSKU
from app.domains.admin.models import AuditLog
from app.core.security import get_password_hash
from decimal import Decimal

@pytest.mark.asyncio
async def test_admin_impersonation_cart_editing(client: AsyncClient, db_session: AsyncSession):
    """
    Test Rule #4: Admin Impersonation.
    Verifies that a superuser can act on behalf of a regular user by passing the
    'X-Impersonate-User' header, effectively editing the user's cart without affecting
    the admin's own cart, and ensuring that an AuditLog is recorded.
    """
    
    # 1. Setup Data
    region = Region(name="North", shipping_cost=Decimal("20.00"), delivery_days=3)
    db_session.add(region)
    await db_session.commit()
    await db_session.refresh(region)

    # Admin User
    admin = User(
        email="admin@bingo.online",
        hashed_password=get_password_hash("admin123"),
        first_name="Super",
        last_name="Admin",
        is_superuser=True,
        is_active=True
    )
    # Regular User
    customer = User(
        email="grandma@bingo.online",
        hashed_password=get_password_hash("grandma123"),
        first_name="Grandma",
        last_name="Cohen",
        is_active=True,
        region_id=region.id
    )
    db_session.add_all([admin, customer])
    await db_session.commit()
    await db_session.refresh(admin)
    await db_session.refresh(customer)

    # Setup Product
    ptype = ProductType(name="Curtains")
    db_session.add(ptype)
    await db_session.commit()
    await db_session.refresh(ptype)

    model = ProductModel(name="Silk", product_type_id=ptype.id, base_price=Decimal("100.00"))
    db_session.add(model)
    await db_session.commit()
    await db_session.refresh(model)

    sku = ColorSKU(product_model_id=model.id, color_name="White", stock_meters=Decimal("50.00"))
    db_session.add(sku)
    await db_session.commit()
    await db_session.refresh(sku)

    # 2. Login as Admin
    login_res = await client.post(
        "/api/v1/users/login",
        data={"username": "admin@bingo.online", "password": "admin123"}
    )
    admin_token = login_res.json()["access_token"]
    
    # Base headers for admin
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Impersonation headers
    impersonate_headers = {
        "Authorization": f"Bearer {admin_token}",
        "X-Impersonate-User": str(customer.id)
    }

    # 3. Admin adds item to CUSTOMER'S cart using impersonation header
    add_payload = {"color_sku_id": sku.id, "length_meters": 5.0, "units": 2}
    add_res = await client.post("/api/v1/orders/cart", json=add_payload, headers=impersonate_headers)
    assert add_res.status_code == 200
    
    # 4. Verify Customer's Cart
    # Admin fetches customer's cart via impersonation
    cart_res = await client.get("/api/v1/orders/cart", headers=impersonate_headers)
    assert cart_res.status_code == 200
    cart_data = cart_res.json()
    assert len(cart_data["items"]) == 1
    assert cart_data["items"][0]["color_sku"]["id"] == sku.id
    
    # 5. Verify Admin's OWN Cart is empty! (Impersonation didn't leak into admin's session)
    admin_cart_res = await client.get("/api/v1/orders/cart", headers=headers)
    assert admin_cart_res.status_code == 200
    admin_cart_data = admin_cart_res.json()
    assert len(admin_cart_data["items"]) == 0

    # 6. Verify Audit Log was created for the modification
    stmt = select(AuditLog).where(AuditLog.admin_id == admin.id, AuditLog.impersonated_user_id == customer.id)
    result = await db_session.execute(stmt)
    logs = result.scalars().all()
    
    # There should be exactly one log for the POST request (GET requests are not logged per security.py)
    assert len(logs) == 1
    assert logs[0].action == "Impersonation Modification"
    assert "POST /api/v1/orders/cart" in logs[0].endpoint
