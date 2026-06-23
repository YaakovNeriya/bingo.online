import redis.asyncio as redis
import json
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)

async def get_cache(key: str):
    data = await redis_client.get(key)
    if data:
        return json.loads(data)
    return None

async def set_cache(key: str, data: dict | list, expire: int = 3600):
    await redis_client.set(key, json.dumps(data), ex=expire)

async def delete_cache(key: str):
    await redis_client.delete(key)
