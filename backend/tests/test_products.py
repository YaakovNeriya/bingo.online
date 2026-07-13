import pytest
from httpx import AsyncClient
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
