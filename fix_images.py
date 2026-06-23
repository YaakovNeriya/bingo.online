import asyncio
from app.db.database import async_session_maker
from app.domains.products.models import ColorSKU
from sqlalchemy import select

async def main():
    async with async_session_maker() as session:
        result = await session.execute(select(ColorSKU))
        skus = result.scalars().all()
        for sku in skus:
            if sku.image_urls:
                new_urls = []
                changed = False
                for url in sku.image_urls:
                    if url.startswith("http://localhost:8000"):
                        new_urls.append(url.replace("http://localhost:8000", ""))
                        changed = True
                    else:
                        new_urls.append(url)
                if changed:
                    sku.image_urls = new_urls
                    session.add(sku)
        await session.commit()
        print("Fixed image URLs in DB!")

if __name__ == "__main__":
    asyncio.run(main())
