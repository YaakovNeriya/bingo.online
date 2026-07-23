import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from unittest.mock import patch
from app.utils.cache import delete_cache
from app.domains.products.services import CACHE_KEY_CATALOG

@pytest.mark.asyncio
async def test_get_catalog_empty(client: AsyncClient):
    response = await client.get("/api/v1/products/catalog")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_get_catalog_concurrency(client: AsyncClient):
    """
    Test Cache Stampede prevention.
    Launch 10 concurrent requests when cache is empty.
    The DB query (_build_catalog_data) should only run ONCE.
    """
    # 1. Ensure cache is empty
    await delete_cache(CACHE_KEY_CATALOG)
    
    call_count = 0
    original_build = None
    
    # We will mock the internal _build_catalog_data to track calls and simulate a slow DB
    async def mock_build_catalog_data(db):
        nonlocal call_count, original_build
        call_count += 1
        # Simulate slow DB query
        await asyncio.sleep(0.5)
        return [{"id": 1, "name": "Test Type", "product_models": []}]

    with patch("app.domains.products.services._build_catalog_data", side_effect=mock_build_catalog_data):
        # 2. Fire 10 concurrent requests
        tasks = [client.get("/api/v1/products/catalog") for _ in range(10)]
        responses = await asyncio.gather(*tasks)
        
        # 3. Assertions
        # All 10 requests should succeed
        for resp in responses:
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) == 1
            assert data[0]["name"] == "Test Type"
            
        # The ultimate proof of Cache Stampede prevention: DB was hit only ONCE!
        assert call_count == 1

@pytest.mark.asyncio
async def test_product_model_image_and_video_urls(client: AsyncClient, db_session: AsyncSession):
    from app.domains.users.models import User
    from app.core.security import get_password_hash, create_access_token

    # Create admin user
    admin = User(
        email="admin_media@bingo.online",
        hashed_password=get_password_hash("admin123"),
        first_name="Admin",
        is_superuser=True,
        is_active=True
    )
    db_session.add(admin)
    await db_session.commit()

    token = create_access_token(admin.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a Product Type
    res_type = await client.post("/api/v1/admin/product-types", json={"name": "Media Test Type"}, headers=headers)
    assert res_type.status_code == 200
    type_id = res_type.json()["id"]

    # 2. Create a Product Model with image_url and video_url
    model_payload = {
        "name": "Model With Media",
        "product_type_id": type_id,
        "base_price": "100.00",
        "fabric_height": "1.50",
        "image_url": "https://example.com/main_image.jpg",
        "video_url": "https://wistia.com/medias/xyz123"
    }
    res_model = await client.post("/api/v1/admin/product-models", json=model_payload, headers=headers)
    assert res_model.status_code == 200
    model_data = res_model.json()
    assert model_data["image_url"] == "https://example.com/main_image.jpg"
    assert model_data["video_url"] == "https://wistia.com/medias/xyz123"

    # 3. Update the Product Model media fields
    update_payload = {
        "image_url": "https://example.com/new_image.jpg",
        "video_url": "https://wistia.com/medias/updated456"
    }
    res_update = await client.put(f"/api/v1/admin/product-models/{model_data['id']}", json=update_payload, headers=headers)
    assert res_update.status_code == 200
    updated_data = res_update.json()
    assert updated_data["image_url"] == "https://example.com/new_image.jpg"
    assert updated_data["video_url"] == "https://wistia.com/medias/updated456"


