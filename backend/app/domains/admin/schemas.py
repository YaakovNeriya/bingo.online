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

from typing import List, Dict, Any

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

class ColorSKUUpdate(BaseModel):
    sku: Optional[str] = None
    color_name: Optional[str] = None
    stock_meters: Optional[Decimal] = None
    specific_price: Optional[Decimal] = None
    image_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None

from typing import List, Dict, Any

class OrderStatusUpdate(BaseModel):
    status: str

class SalesReportOut(BaseModel):
    total_revenue: Decimal
    total_orders: int
    best_sellers: List[Dict[str, Any]]
    traffic_sources: Dict[str, int] = {}

class SiteSettingUpdate(BaseModel):
    value: str

class SiteSettingOut(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

from app.domains.users.schemas import RegionOut, UserOut

class RegionWithCustomerCount(RegionOut):
    customer_count: int

class CustomerWithOrderCount(UserOut):
    order_count: int

class SortedCustomerItem(BaseModel):
    product_name: str
    color_name: str
    category: str
    sku: Optional[str] = None
    length_meters: float
    units: int
    price: float
    status: str

class SortedCustomer(BaseModel):
    sort_index: int
    id: int
    email: str
    first_name: str
    last_name: Optional[str] = ""
    phone: Optional[str] = None
    items: List[SortedCustomerItem]
    total: float
