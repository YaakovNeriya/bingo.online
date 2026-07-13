import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session):
    from app.domains.users.models import Region
    region = Region(name="Center", shipping_cost=20, delivery_days=3)
    db_session.add(region)
    await db_session.commit()
    
    response = await client.post(
        "/api/v1/users/register",
        json={
            "email": "test@bingo.online",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User",
            "phone": "0528765432",
            "region_id": region.id
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@bingo.online"
    assert "id" in data

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, db_session):
    from app.domains.users.models import Region
    region = Region(name="North", shipping_cost=25, delivery_days=2)
    db_session.add(region)
    await db_session.commit()

    payload = {
        "email": "test@bingo.online",
        "password": "password123",
        "first_name": "Test2",
        "last_name": "User2",
        "phone": "0528765432",
        "region_id": region.id
    }
    
    # First registration should succeed
    response1 = await client.post("/api/v1/users/register", json=payload)
    assert response1.status_code == 200

    # Second registration should fail
    response2 = await client.post("/api/v1/users/register", json=payload)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"].lower() or "קיים במערכת" in response2.json()["detail"]

@pytest.mark.asyncio
async def test_login_cookie(client: AsyncClient, db_session):
    from app.domains.users.models import Region
    region = Region(name="South", shipping_cost=25, delivery_days=2)
    db_session.add(region)
    await db_session.commit()

    payload = {
        "email": "cookie@bingo.online",
        "password": "password123",
        "first_name": "Cookie",
        "last_name": "Monster",
        "phone": "0528765432",
        "region_id": region.id
    }
    
    # Register
    await client.post("/api/v1/users/register", json=payload)
    
    # Login
    login_data = {
        "username": "cookie@bingo.online",
        "password": "password123"
    }
    response = await client.post("/api/v1/users/login", data=login_data)
    
    assert response.status_code == 200
    
    # Check if 'set-cookie' is in headers
    assert "set-cookie" in response.headers.keys()
    cookie_str = response.headers.get("set-cookie")
    assert "access_token=" in cookie_str
    assert "HttpOnly" in cookie_str
    assert "SameSite=lax" in cookie_str

@pytest.mark.asyncio
async def test_update_user_profile(client: AsyncClient, db_session):
    from app.domains.users.models import Region
    region1 = Region(name="Region1", shipping_cost=10, delivery_days=2)
    region2 = Region(name="Region2", shipping_cost=15, delivery_days=4)
    db_session.add_all([region1, region2])
    await db_session.commit()

    payload = {
        "email": "update@bingo.online",
        "password": "password123",
        "first_name": "Before",
        "last_name": "User",
        "phone": "0547654321",
        "region_id": region1.id
    }
    
    # Register
    await client.post("/api/v1/users/register", json=payload)
    
    # Login
    await client.post("/api/v1/users/login", data={"username": "update@bingo.online", "password": "password123"})
    
    # Update profile (PUT /me)
    update_payload = {
        "first_name": "After",
        "last_name": "Updated",
        "phone": "0509876543",
        "region_id": region2.id
    }
    response = await client.put("/api/v1/users/me", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "After"
    assert data["last_name"] == "Updated"
    assert data["phone"] == "0509876543"
    assert data["region_id"] == region2.id

@pytest.mark.asyncio
async def test_update_user_password(client: AsyncClient, db_session):
    from app.domains.users.models import Region
    region = Region(name="RegionPass", shipping_cost=10, delivery_days=2)
    db_session.add(region)
    await db_session.commit()

    payload = {
        "email": "password_change@bingo.online",
        "password": "old_password",
        "first_name": "Pass",
        "last_name": "Change",
        "phone": "0547654321",
        "region_id": region.id
    }
    
    # Register
    await client.post("/api/v1/users/register", json=payload)
    
    # Login with old password
    await client.post("/api/v1/users/login", data={"username": "password_change@bingo.online", "password": "old_password"})
    
    # Try updating password with incorrect current password
    fail_update = {
        "password": "new_password",
        "current_password": "wrong_old_password"
    }
    response = await client.put("/api/v1/users/me", json=fail_update)
    assert response.status_code == 400
    assert "הסיסמה הנוכחית" in response.json()["detail"]

    # Update password with correct current password
    success_update = {
        "password": "new_password",
        "current_password": "old_password"
    }
    response = await client.put("/api/v1/users/me", json=success_update)
    assert response.status_code == 200

    # Logout
    await client.post("/api/v1/users/logout")

    # Login with new password
    login_response = await client.post("/api/v1/users/login", data={"username": "password_change@bingo.online", "password": "new_password"})
    assert login_response.status_code == 200
