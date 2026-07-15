from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, List

from app.db.database import get_db
from app.domains.admin import schemas, services
from app.core.security import get_current_active_superuser
from app.domains.users.models import User
from app.domains.products import schemas as prod_schemas
from app.core.rate_limit import limiter

router = APIRouter()

from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

@router.post("/product-types", response_model=prod_schemas.ProductTypeOut)
@limiter.limit("15/minute")
async def create_product_type(
    request: Request,
    obj_in: schemas.ProductTypeCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    try:
        return await services.create_product_type(db, obj_in)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="קטגוריה בשם זה כבר קיימת.")

@router.post("/product-models", response_model=prod_schemas.ProductModelOut)
@limiter.limit("15/minute")
async def create_product_model(
    request: Request,
    obj_in: schemas.ProductModelCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    try:
        return await services.create_product_model(db, obj_in)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="דגם זה כבר קיים או שגיאת נתונים.")

@router.post("/color-skus", response_model=prod_schemas.ColorSKUOut)
@limiter.limit("15/minute")
async def create_color_sku(
    request: Request,
    obj_in: schemas.ColorSKUCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    try:
        return await services.create_color_sku(db, obj_in)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="מק\"ט זה כבר קיים או שגיאת נתונים.")

@router.delete("/color-skus/{sku_id}")
@limiter.limit("15/minute")
async def delete_color_sku(
    request: Request,
    sku_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.delete_color_sku(db, sku_id)

from fastapi import UploadFile, File, Query
import shutil
import os
import uuid

@router.put("/product-types/{type_id}", response_model=prod_schemas.ProductTypeOut)
@limiter.limit("15/minute")
async def update_product_type(
    request: Request,
    type_id: int,
    obj_in: schemas.ProductTypeUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    obj = await services.update_product_type(db, type_id, obj_in)
    if not obj:
        raise HTTPException(status_code=404, detail="Product Type not found")
    return obj

@router.delete("/product-types/{type_id}")
@limiter.limit("15/minute")
async def delete_product_type(
    request: Request,
    type_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    await services.delete_product_type(db, type_id)
    return {"msg": "Deleted successfully"}

@router.put("/product-models/{model_id}", response_model=prod_schemas.ProductModelOut)
@limiter.limit("15/minute")
async def update_product_model(
    request: Request,
    model_id: int,
    obj_in: schemas.ProductModelUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    obj = await services.update_product_model(db, model_id, obj_in)
    if not obj:
        raise HTTPException(status_code=404, detail="Product Model not found")
    return obj

@router.delete("/product-models/{model_id}")
@limiter.limit("15/minute")
async def delete_product_model(
    request: Request,
    model_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    await services.delete_product_model(db, model_id)
    return {"msg": "Deleted successfully"}

@router.put("/color-skus/{sku_id}", response_model=prod_schemas.ColorSKUOut)
@limiter.limit("15/minute")
async def update_color_sku(
    request: Request,
    sku_id: int,
    obj_in: schemas.ColorSKUUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_active_superuser)
) -> Any:
    obj = await services.update_color_sku(db, sku_id, obj_in, admin_id=admin_user.id)
    if not obj:
        raise HTTPException(status_code=404, detail="SKU not found")
    return obj

from app.domains.products.models import ProductType, ProductModel, ColorSKU

@router.patch("/product-types/{type_id}/reorder")
@limiter.limit("30/minute")
async def reorder_product_type(
    request: Request,
    type_id: int,
    payload: schemas.ReorderRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    success = await services.reorder_item(db, ProductType, type_id, payload.direction)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot reorder item")
    return {"msg": "Reordered successfully"}

@router.patch("/product-models/{model_id}/reorder")
@limiter.limit("30/minute")
async def reorder_product_model(
    request: Request,
    model_id: int,
    payload: schemas.ReorderRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    # First, fetch the model to know its product_type_id
    stmt = select(ProductModel).where(ProductModel.id == model_id)
    target = (await db.execute(stmt)).scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="Model not found")
        
    success = await services.reorder_item(db, ProductModel, model_id, payload.direction, product_type_id=target.product_type_id, is_active=True)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot reorder item")
    return {"msg": "Reordered successfully"}

@router.patch("/color-skus/{sku_id}/reorder")
@limiter.limit("30/minute")
async def reorder_color_sku(
    request: Request,
    sku_id: int,
    payload: schemas.ReorderRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    stmt = select(ColorSKU).where(ColorSKU.id == sku_id)
    target = (await db.execute(stmt)).scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="SKU not found")
        
    success = await services.reorder_item(db, ColorSKU, sku_id, payload.direction, product_model_id=target.product_model_id, is_active=True)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot reorder item")
    return {"msg": "Reordered successfully"}

import asyncio
import io
import os
import uuid
from PIL import Image
from fastapi import File, UploadFile, Query

import io
import os
import uuid
from typing import Optional
 
from PIL import Image, ImageOps, UnidentifiedImageError
 
# WebP encoding effort: 0=fast/bigger file, 6=slow/smaller file.
# This runs in a background upload job, not on the request's critical path,
# so it's worth spending the extra CPU time for better compression.
WEBP_METHOD = 6
 
# Longest edge (px) for the saved image. 2000 comfortably covers a zoomed-in
# product view without shipping the full 3000x3000 original.
MAX_EDGE = 2000
 
# Below this file size we assume the source is already fairly compressed
# (e.g. forwarded via WhatsApp) and skip an aggressive re-resize.
SMALL_FILE_THRESHOLD_KB = 300
 
 
def process_image_sync(image_data: bytes, aspect_ratio: Optional[str], upload_dir: str) -> str:
    """
    Convert an uploaded image into an optimized WebP file and save it to upload_dir.
    Returns the generated filename.
    """
    size_kb = len(image_data) / 1024
 
    try:
        img = Image.open(io.BytesIO(image_data))
        img.load()  # force full decode now, so a corrupt/truncated upload fails
    except UnidentifiedImageError as e:  # not a valid image at all
        raise ValueError("הקובץ שהועלה אינו תמונה תקינה") from e
 
    # Keep the color profile (e.g. Display P3 from iPhones) so colors stay accurate
    # after we strip the rest of the metadata. Important for clothing photos.
    icc_profile = img.info.get("icc_profile")
 
    # 1) Bake in EXIF orientation BEFORE anything else.
    #    Phone cameras store pixels in landscape and rely on this tag to rotate
    #    them for display. Skipping this step (as the original code did) means
    #    portrait photos get saved sideways/upside-down once EXIF is dropped.
    img = ImageOps.exif_transpose(img)
 
    # 2) Source images never have transparency (phone camera photos only),
    #    so a plain mode conversion is safe and cheap.
    img = img.convert("RGB")
 
    # 3) Optional center-crop to a target aspect ratio (e.g. "1:1")
    if aspect_ratio:
        img = _crop_to_ratio(img, aspect_ratio)
 
    # 4) Decide resize/quality based on BOTH file size and actual resolution.
    #    (The original only checked KB, so a well-compressed but huge-resolution
    #    image, e.g. a flat-background photo, could slip through at full size.)
    if size_kb < SMALL_FILE_THRESHOLD_KB and max(img.size) <= MAX_EDGE:
        quality = 90  # light touch, already small
    else:
        img.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
        quality = 80
 
    os.makedirs(upload_dir, exist_ok=True)
    new_filename = f"{uuid.uuid4().hex}.webp"
    file_path = os.path.join(upload_dir, new_filename)
 
    # No `exif=` is passed, so GPS/device/date metadata is dropped automatically.
    # icc_profile IS passed, so color rendering stays correct.
    img.save(file_path, "WEBP", quality=quality, method=WEBP_METHOD, icc_profile=icc_profile)
 
    return new_filename
 
 
def _crop_to_ratio(img: Image.Image, aspect_ratio: str) -> Image.Image:
    """Center-crop img to a 'W:H' ratio. Returns img unchanged if the string
    is invalid or the image already matches the ratio."""
    try:
        w_ratio, h_ratio = (int(x) for x in aspect_ratio.split(":"))
        if w_ratio <= 0 or h_ratio <= 0:
            raise ValueError
    except (ValueError, AttributeError):
        return img  # invalid input -> don't guess, just skip cropping
 
    target_ratio = w_ratio / h_ratio
    current_ratio = img.width / img.height
 
    if abs(current_ratio - target_ratio) <= 0.01:
        return img
 
    if current_ratio > target_ratio:
        new_width = round(img.height * target_ratio)
        left = (img.width - new_width) // 2
        return img.crop((left, 0, left + new_width, img.height))
    else:
        new_height = round(img.width / target_ratio)
        top = (img.height - new_height) // 2
        return img.crop((0, top, img.width, top + new_height))


@router.post("/upload-image")
@limiter.limit("30/minute")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    aspect_ratio: str = Query(None, description="Optional aspect ratio to crop the image to, e.g. '4:3' or '1:1'"),
    _ = Depends(get_current_active_superuser)
) -> Any:
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    image_data = await file.read()
    
    try:
        new_filename = await asyncio.to_thread(process_image_sync, image_data, aspect_ratio, upload_dir)
        return {"image_url": f"/uploads/{new_filename}"}
    except Exception as e:
        # Fallback to direct save if Pillow fails for any reason
        ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        new_filename = f"{uuid.uuid4().hex}.{ext}"
        file_path = os.path.join(upload_dir, new_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(image_data)
        return {"image_url": f"/uploads/{new_filename}"}

from typing import List
from app.domains.orders import schemas as order_schemas

@router.get("/orders", response_model=List[schemas.AdminOrderOut])
@limiter.limit("30/minute")
async def get_orders(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_all_orders(db)

@router.patch("/orders/{order_id}/status", response_model=schemas.AdminOrderOut)
@limiter.limit("30/minute")
async def update_order_status(
    request: Request,
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_active_superuser)
) -> Any:
    order = await services.update_order_status(db, order_id, status_update.status, admin_id=admin_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/carts/abandoned", response_model=List[order_schemas.CartOut])
@limiter.limit("30/minute")
async def get_abandoned_carts(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_abandoned_carts(db)

@router.get("/reports/season-stats", response_model=schemas.SeasonStatsOut)
@limiter.limit("15/minute")
async def get_season_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_season_stats(db)



@router.get("/settings", response_model=List[schemas.SiteSettingOut])
@limiter.limit("30/minute")
async def get_settings(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_site_settings(db)

@router.patch("/settings/{key}", response_model=schemas.SiteSettingOut)
@limiter.limit("15/minute")
async def update_setting(
    request: Request,
    key: str,
    update_in: schemas.SiteSettingUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.update_site_setting(db, key, update_in)

from app.domains.users import schemas as user_schemas

@router.post("/regions", response_model=user_schemas.RegionOut)
@limiter.limit("15/minute")
async def create_region(request: Request, region_in: user_schemas.RegionCreate, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.create_region(db, region_in)

@router.put("/regions/{region_id}", response_model=user_schemas.RegionOut)
@limiter.limit("15/minute")
async def update_region(request: Request, region_id: int, region_in: user_schemas.RegionCreate, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    region = await services.update_region(db, region_id, region_in)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    return region

@router.delete("/regions/{region_id}", status_code=204)
@limiter.limit("15/minute")
async def delete_region(request: Request, region_id: int, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    await services.delete_region(db, region_id)
    return None

@router.get("/customers/regions", response_model=List[schemas.RegionWithCustomerCount])
@limiter.limit("30/minute")
async def get_customers_regions(request: Request, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_regions_with_customer_count(db)

@router.get("/customers/regions/{region_id}", response_model=List[schemas.CustomerWithOrderCount])
@limiter.limit("30/minute")
async def get_customers_in_region(request: Request, region_id: str, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_customers_in_region(db, region_id)

@router.get("/customers/{user_id}/orders", response_model=List[order_schemas.OrderOut])
@limiter.limit("30/minute")
async def get_customer_orders(request: Request, user_id: int, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_customer_orders(db, user_id)

@router.get("/customers/regions/{region_id}/sorted", response_model=List[schemas.SortedCustomer])
@limiter.limit("30/minute")
async def get_customers_in_region_sorted(request: Request, region_id: str, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_customers_in_region_sorted(db, region_id)

@router.post("/season-archives", response_model=schemas.SeasonArchiveOut)
@limiter.limit("10/minute")
async def create_season_archive(request: Request, archive_in: schemas.SeasonArchiveCreate, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.create_season_archive(db, archive_in)

@router.get("/season-archives", response_model=List[schemas.SeasonArchiveListOut])
@limiter.limit("30/minute")
async def get_all_season_archives(request: Request, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_all_season_archives(db)

@router.get("/season-archives/{archive_id}", response_model=schemas.SeasonArchiveOut)
@limiter.limit("30/minute")
async def get_season_archive(request: Request, archive_id: int, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    archive = await services.get_season_archive(db, archive_id)
    if not archive:
        raise HTTPException(status_code=404, detail="Archive not found")
    return archive

@router.get("/audit-logs", response_model=List[schemas.AuditLogOut])
@limiter.limit("30/minute")
async def get_audit_logs(
    request: Request,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    from app.domains.admin.models import AuditLog
    from sqlalchemy import select
    res = await db.execute(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100))
    return res.scalars().all()

@router.post("/season/reset")
@limiter.limit("5/minute")
async def reset_season(
    request: Request,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_active_superuser)
):
    """
    WARNING: DESTRUCTIVE ACTION
    Deletes the catalog, empties carts, clears physical images, and archives orders.
    Requires exact typed confirmation in the payload.
    """
    season_name = payload.get("season_name")
    confirmation_text = payload.get("confirmation_text")
    
    if not season_name:
        raise HTTPException(status_code=400, detail="Season name is required")
        
    if confirmation_text != "אישור מחיקת עונה":
        raise HTTPException(status_code=400, detail="Invalid confirmation text")

    await services.reset_season(db, season_name=season_name)
    return {"message": "Season reset successfully"}

@router.post("/season/archive-orders")
@limiter.limit("5/minute")
async def archive_season_orders(
    request: Request,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_active_superuser)
):
    season_name = payload.get("season_name")
    if not season_name:
        raise HTTPException(status_code=400, detail="Season name is required")
        
    await services.archive_season_orders(db, season_name=season_name)
    return {"message": "Orders archived successfully"}

@router.get("/wistia/videos")
@limiter.limit("30/minute")
async def get_wistia_videos(
    request: Request,
    _ = Depends(get_current_active_superuser)
):
    return await services.get_wistia_videos_list()

@router.delete("/wistia/videos/{hashed_id}")
@limiter.limit("15/minute")
async def delete_wistia_video(
    request: Request,
    hashed_id: str,
    _ = Depends(get_current_active_superuser)
):
    return await services.delete_wistia_video(hashed_id)

@router.post("/wistia/upload")
@limiter.limit("15/minute")
async def upload_wistia_video(
    request: Request,
    file: UploadFile = File(...),
    _ = Depends(get_current_active_superuser)
):
    return await services.upload_video_to_wistia(file)

import glob
import os
import datetime
from fastapi import BackgroundTasks
import subprocess
import sys

def run_manual_backup():
    try:
        subprocess.run([sys.executable, "backup_to_drive.py"], check=True)
    except Exception as e:
        print(f"Manual backup failed: {e}")

@router.get("/backups", response_model=List[schemas.BackupFolderOut])
async def get_backups(
    _ = Depends(get_current_active_superuser)
):
    backups_list = []
    if os.path.exists("backups"):
        folders = [f for f in glob.glob("backups/*") if os.path.isdir(f)]
        folders.sort(key=os.path.getmtime, reverse=True)
        for folder in folders:
            name = os.path.basename(folder)
            sql_files = glob.glob(os.path.join(folder, "*.sql.gz"))
            tar_files = glob.glob(os.path.join(folder, "*.tar.gz"))
            
            db_size = os.path.getsize(sql_files[0]) if sql_files else 0
            img_size = os.path.getsize(tar_files[0]) if tar_files else 0
            
            created_at = datetime.datetime.fromtimestamp(os.path.getmtime(folder)).isoformat()
            is_valid = bool(sql_files)
            
            backups_list.append({
                "name": name,
                "db_size_bytes": db_size,
                "images_size_bytes": img_size,
                "created_at": created_at,
                "is_valid": is_valid
            })
    return backups_list

@router.post("/backups/trigger")
async def trigger_backup(
    background_tasks: BackgroundTasks,
    _ = Depends(get_current_active_superuser)
):
    background_tasks.add_task(run_manual_backup)
    return {"message": "Backup triggered in background"}
