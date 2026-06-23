import asyncio
from app.db.database import async_session_maker
from app.domains.products.models import ProductType, ProductModel, ColorSKU
from app.utils.cache import delete_cache
from app.domains.products.services import CACHE_KEY_CATALOG

async def seed():
    async with async_session_maker() as db:
        print("Seeding demo data...")
        
        # Create Types
        cotton = ProductType(name="כותנה")
        linen = ProductType(name="פשתן")
        silk = ProductType(name="משי")
        
        db.add_all([cotton, linen, silk])
        await db.commit()
        
        # Create Models
        cotton_org = ProductModel(name="כותנה אורגנית עבה", product_type_id=cotton.id, base_price=45.50)
        cotton_smooth = ProductModel(name="כותנה חלקה לקיץ", product_type_id=cotton.id, base_price=30.00)
        linen_natural = ProductModel(name="פשתן טבעי", product_type_id=linen.id, base_price=60.00)
        silk_premium = ProductModel(name="משי יוקרתי", product_type_id=silk.id, base_price=120.00)
        
        db.add_all([cotton_org, cotton_smooth, linen_natural, silk_premium])
        await db.commit()
        
        # Create SKUs
        skus = [
            ColorSKU(sku="ORG-WHT", color_name="לבן שלג", product_model_id=cotton_org.id, stock_meters=150.0),
            ColorSKU(sku="ORG-BLK", color_name="שחור פחם", product_model_id=cotton_org.id, stock_meters=80.5),
            ColorSKU(sku="SMT-BLU", color_name="כחול ים", product_model_id=cotton_smooth.id, stock_meters=200.0),
            ColorSKU(sku="SMT-RED", color_name="אדום יין", product_model_id=cotton_smooth.id, stock_meters=50.0, specific_price=35.00),
            ColorSKU(sku="LIN-NAT", color_name="בז' טבעי", product_model_id=linen_natural.id, stock_meters=300.0),
            ColorSKU(sku="SIL-GLD", color_name="זהב מלכותי", product_model_id=silk_premium.id, stock_meters=20.0),
        ]
        db.add_all(skus)
        await db.commit()
        
        # Invalidate Cache
        await delete_cache(CACHE_KEY_CATALOG)
        print("Demo data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
