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
            "phone": "0501234567",
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
        "phone": "0501234567",
        "region_id": region.id
    }
    
    # First registration should succeed
    response1 = await client.post("/api/v1/users/register", json=payload)
    assert response1.status_code == 200

    # Second registration should fail
    response2 = await client.post("/api/v1/users/register", json=payload)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"].lower() or "קיים במערכת" in response2.json()["detail"]
