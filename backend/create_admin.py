import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import async_session_maker
from app.domains.users.models import User, Region
from app.core.security import get_password_hash
from sqlalchemy import select
from app.core.config import settings

async def main():
    async with async_session_maker() as session:
        # Check if region exists, if not create a default one
        result = await session.execute(select(Region).limit(1))
        region = result.scalars().first()
        if not region:
            region = Region(name="Default Region", shipping_cost=0, delivery_days=1)
            session.add(region)
            await session.commit()
            await session.refresh(region)

        email = settings.ADMIN_EMAIL
        password = settings.ADMIN_PASSWORD
        
        # Check if user exists
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                phone="0500000000",
                region_id=region.id,
                is_superuser=True
            )
            session.add(user)
            await session.commit()
            print("Admin user created successfully!")
        else:
            user.is_superuser = True
            user.hashed_password = get_password_hash(password)
            await session.commit()
            print("Existing user updated to superuser!")

if __name__ == "__main__":
    asyncio.run(main())
