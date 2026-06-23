import asyncio
from app.db.session import SessionLocal
from app.domains.admin.models import SiteSetting
from sqlalchemy import select

async def main():
    async with SessionLocal() as db:
        result = await db.execute(select(SiteSetting).where(SiteSetting.key == 'about_image_url'))
        setting = result.scalars().first()
        if not setting:
            setting = SiteSetting(key='about_image_url', value='/fabric_banner_cropped.png')
            db.add(setting)
        else:
            setting.value = '/fabric_banner_cropped.png'
        await db.commit()

asyncio.run(main())
