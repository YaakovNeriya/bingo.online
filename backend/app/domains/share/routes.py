from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
import logging
from app.db.database import get_db
from app.utils.cache import redis_client
from app.domains.products.models import ProductModel
from app.core.config import settings

router = APIRouter()

# ---------------------------------------------------------
# Observability: Dedicated Logger for Share/OG Tags
# ---------------------------------------------------------
og_logger = logging.getLogger("og_monitor")
og_logger.setLevel(logging.INFO)
# In production, this can be routed to a specific file or Discord alert
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - OG_MONITOR - %(levelname)s - %(message)s'))
og_logger.addHandler(handler)
# ---------------------------------------------------------

@router.get("/product/{model_id}", response_class=HTMLResponse)
async def share_product_og(
    request: Request,
    model_id: int,
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"og_html_{model_id}"
    
    # 1. Check Redis Cache
    try:
        cached_html = await redis_client.get(cache_key)
        if cached_html:
            og_logger.info(f"Cache HIT for model_id {model_id}")
            return HTMLResponse(content=cached_html)
    except Exception as e:
        og_logger.error(f"Redis cache read error for model_id {model_id}: {e}")

    og_logger.info(f"Generating OG Tags for model_id {model_id} (Cache MISS)")

    try:
        # Fetch the product model with its colors
        stmt = select(ProductModel).options(
            selectinload(ProductModel.product_type),
            selectinload(ProductModel.color_skus)
        ).where(ProductModel.id == model_id, ProductModel.is_active == True)
        
        result = await db.execute(stmt)
        product = result.scalars().first()
        
        if not product:
            og_logger.warning(f"Product not found: model_id {model_id}")
            raise HTTPException(status_code=404, detail="Product not found")

        # Find the first available image from the color SKUs (filtering out videos)
        image_url = None
        for color in product.color_skus:
            if color.image_urls and len(color.image_urls) > 0:
                for url in color.image_urls:
                    if url.endswith(('.webp', '.png', '.jpg', '.jpeg')):
                        image_url = url
                        break
            if image_url:
                break
                
        # Default image if no product image exists
        if not image_url:
            image_url = "/logo.png" # Assuming there's a default logo
        else:
            # Generate the elegant framed watermark image
            from app.domains.share.services import generate_share_image
            image_url = await generate_share_image(model_id, image_url)

        # Determine full image URL (WhatsApp needs absolute URLs)
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        if image_url.startswith("/"):
            full_image_url = f"{frontend_url}{image_url}"
        else:
            full_image_url = image_url

        title = f"בינגו בדים - {product.name}"
        description = f"בד {product.product_type.name} איכותי. לחצו כאן לפרטים והזמנה."
        
        # Generate the minimal HTML with OG Tags
        html_content = f"""
        <!DOCTYPE html>
        <html lang="he">
        <head>
            <meta charset="UTF-8">
            <title>{title}</title>
            <meta property="og:title" content="{title}" />
            <meta property="og:description" content="{description}" />
            <meta property="og:image" content="{full_image_url}" />
            <meta property="og:type" content="product" />
            <meta property="og:url" content="{frontend_url}/product/{model_id}" />
            <meta property="product:price:amount" content="{product.base_price}" />
            <meta property="product:price:currency" content="ILS" />
        </head>
        <body>
            <p>מעביר אותך למוצר...</p>
            <script>
                // If a real user somehow lands here, redirect them to the frontend
                window.location.href = "{frontend_url}/product/{model_id}";
            </script>
        </body>
        </html>
        """
        
        # 3. Save to Redis Cache (expire in 24 hours)
        try:
            await redis_client.set(cache_key, html_content, ex=86400)
            og_logger.info(f"Saved to cache for model_id {model_id}")
        except Exception as e:
            og_logger.error(f"Redis cache write error for model_id {model_id}: {e}")

        return HTMLResponse(content=html_content)

    except HTTPException:
        raise
    except Exception as e:
        og_logger.error(f"Critical failure generating OG tags for model_id {model_id}: {e}", exc_info=True)
        # Fallback minimal HTML to prevent sharing a broken link completely
        fallback_html = """
        <!DOCTYPE html>
        <html lang="he">
        <head>
            <meta charset="UTF-8">
            <title>בינגו בדים</title>
            <meta property="og:title" content="בינגו בדים" />
        </head>
        <body>
            <script>window.location.href = "/";</script>
        </body>
        </html>
        """
        return HTMLResponse(content=fallback_html)
