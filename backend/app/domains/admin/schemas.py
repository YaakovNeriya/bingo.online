from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

class ProductTypeCreate(BaseModel):
    name: str

class ProductModelCreate(BaseModel):
    name: str
    product_type_id: int
    base_price: Decimal
    fabric_height: Decimal
    image_url: Optional[str] = None
    video_url: Optional[str] = None

from typing import List, Any

class ColorSKUCreate(BaseModel):
    sku: Optional[str] = None
    color_name: str
    product_model_id: int
    stock_meters: Decimal
    specific_price: Optional[Decimal] = None
    image_urls: List[str] = []

class ProductTypeUpdate(BaseModel):
    name: Optional[str] = None

class ProductModelUpdate(BaseModel):
    name: Optional[str] = None
    base_price: Optional[Decimal] = None
    fabric_height: Optional[Decimal] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None

class ColorSKUUpdate(BaseModel):
    sku: Optional[str] = None
    color_name: Optional[str] = None
    stock_meters: Optional[Decimal] = None
    specific_price: Optional[Decimal] = None
    image_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None

from typing import List

class OrderStatusUpdate(BaseModel):
    status: str


class SiteSettingUpdate(BaseModel):
    value: str

class SiteSettingOut(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

from app.domains.users.schemas import RegionOut, UserOut
from app.domains.orders.schemas import OrderOut

class AdminOrderOut(OrderOut):
    user: Optional[UserOut] = None

class RegionWithCustomerCount(RegionOut):
    customer_count: int

class CustomerWithOrderCount(UserOut):
    order_count: int
    cart_items_count: int = 0

class SortedCustomerItem(BaseModel):
    product_name: str
    color_name: str
    category: str
    sku: Optional[str] = None
    length_meters: Decimal
    units: int
    price: Decimal
    status: str

class SortedCustomer(BaseModel):
    sort_index: int
    id: int
    email: str
    first_name: str
    last_name: Optional[str] = ""
    phone: Optional[str] = None
    items: List[SortedCustomerItem]
    total: Decimal

from datetime import datetime

class SeasonArchiveCreate(BaseModel):
    season_name: str
    archive_data: Any

class SeasonArchiveOut(BaseModel):
    id: int
    season_name: str
    archive_data: Any
    created_at: datetime
    
    class Config:
        from_attributes = True

class SeasonArchiveListOut(BaseModel):
    id: int
    season_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SeasonItemStat(BaseModel):
    product_name: str
    color_name: str
    category: str
    sku: Optional[str] = None
    total_meters: Decimal
    total_revenue: Decimal
    total_orders: int

class SeasonStatsOut(BaseModel):
    total_meters: Decimal
    total_revenue: Decimal
    total_items: int
    items_stats: List[SeasonItemStat]

class AuditLogOut(BaseModel):
    id: int
    admin_id: int
    impersonated_user_id: Optional[int] = None
    endpoint: Optional[str] = None
    timestamp: datetime
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    changes: Optional[dict] = None

class ReorderRequest(BaseModel):
    direction: str # "up" or "down"

class BackupFolderOut(BaseModel):
    name: str
    db_size_bytes: int
    images_size_bytes: int
    created_at: str
    is_valid: bool

