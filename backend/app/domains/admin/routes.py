from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.database import get_db
from app.domains.admin import schemas, services
from app.core.security import get_current_active_superuser
from app.domains.products import schemas as prod_schemas

router = APIRouter()

from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

@router.post("/product-types", response_model=prod_schemas.ProductTypeOut)
async def create_product_type(
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
async def create_product_model(
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
async def create_color_sku(
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
async def delete_color_sku(
    sku_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.delete_color_sku(db, sku_id)

from fastapi import UploadFile, File, HTTPException
import shutil
import os
import uuid

@router.put("/product-types/{type_id}", response_model=prod_schemas.ProductTypeOut)
async def update_product_type(
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
async def delete_product_type(
    type_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    await services.delete_product_type(db, type_id)
    return {"msg": "Deleted successfully"}

@router.put("/product-models/{model_id}", response_model=prod_schemas.ProductModelOut)
async def update_product_model(
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
async def delete_product_model(
    model_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    await services.delete_product_model(db, model_id)
    return {"msg": "Deleted successfully"}

@router.put("/color-skus/{sku_id}", response_model=prod_schemas.ColorSKUOut)
async def update_color_sku(
    sku_id: int,
    obj_in: schemas.ColorSKUUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    obj = await services.update_color_sku(db, sku_id, obj_in)
    if not obj:
        raise HTTPException(status_code=404, detail="SKU not found")
    return obj

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    _ = Depends(get_current_active_superuser)
) -> Any:
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split(".")[-1]
    new_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, new_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"image_url": f"/uploads/{new_filename}"}

from typing import List
from app.domains.orders import schemas as order_schemas
from fastapi import HTTPException

@router.get("/orders", response_model=List[order_schemas.OrderOut])
async def get_orders(
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_all_orders(db)

@router.patch("/orders/{order_id}/status", response_model=order_schemas.OrderOut)
async def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    order = await services.update_order_status(db, order_id, status_update.status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/carts/abandoned", response_model=List[order_schemas.CartOut])
async def get_abandoned_carts(
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_abandoned_carts(db)

@router.delete("/carts/abandoned")
async def clear_abandoned_carts(
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.clear_abandoned_carts(db)

@router.get("/reports/sales", response_model=schemas.SalesReportOut)
async def get_sales_report(
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_sales_report(db)

@router.delete("/reports/traffic")
async def clear_traffic_data(
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.clear_traffic_data(db)

@router.get("/settings", response_model=List[schemas.SiteSettingOut])
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.get_site_settings(db)

@router.patch("/settings/{key}", response_model=schemas.SiteSettingOut)
async def update_setting(
    key: str,
    update_in: schemas.SiteSettingUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_superuser)
) -> Any:
    return await services.update_site_setting(db, key, update_in)

from app.domains.users import schemas as user_schemas

@router.post("/regions", response_model=user_schemas.RegionOut)
async def create_region(region_in: user_schemas.RegionCreate, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.create_region(db, region_in)

@router.put("/regions/{region_id}", response_model=user_schemas.RegionOut)
async def update_region(region_id: int, region_in: user_schemas.RegionCreate, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    region = await services.update_region(db, region_id, region_in)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    return region

@router.delete("/regions/{region_id}", status_code=204)
async def delete_region(region_id: int, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    await services.delete_region(db, region_id)
    return None

@router.get("/customers/regions", response_model=List[schemas.RegionWithCustomerCount])
async def get_customers_regions(db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_regions_with_customer_count(db)

@router.get("/customers/regions/{region_id}", response_model=List[schemas.CustomerWithOrderCount])
async def get_customers_in_region(region_id: str, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_customers_in_region(db, region_id)

@router.get("/customers/{user_id}/orders", response_model=List[order_schemas.OrderOut])
async def get_customer_orders(user_id: int, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_customer_orders(db, user_id)

@router.get("/customers/regions/{region_id}/sorted", response_model=List[schemas.SortedCustomer])
async def get_customers_in_region_sorted(region_id: str, db: AsyncSession = Depends(get_db), _ = Depends(get_current_active_superuser)):
    return await services.get_customers_in_region_sorted(db, region_id)
