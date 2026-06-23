import asyncio
from app.db.session import engine
from sqlalchemy import text

async def run():
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT color_name, image_urls FROM color_skus WHERE color_name LIKE \x27%יהלום%\x27 OR color_name LIKE \x27%בורקאד%\x27"))
        for row in res.fetchall():
            print(row)

asyncio.run(run())
