import asyncio
from sqlalchemy import select
from app.db.database import async_session_maker
from app.domains.users.models import Region

async def seed_db():
    async with async_session_maker() as session:
        # Check if region already exists
        result = await session.execute(select(Region).where(Region.name == "Default Region"))
        if result.scalars().first():
            print("Region already exists.")
            return

        region = Region(name="Default Region", shipping_cost=20.00, delivery_days=5)
        session.add(region)
        await session.commit()
        print("Database seeded with Default Region.")

if __name__ == "__main__":
    asyncio.run(seed_db())
