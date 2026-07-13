from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

class ColorSKUOut(BaseModel):
    id: int
    sku: Optional[str] = None
    color_name: str
    product_model_id: int
    stock_meters: Decimal
    specific_price: Optional[Decimal] = None
    image_urls: List[str] = []
    is_active: bool

    class Config:
        from_attributes = True

class ProductModelOut(BaseModel):
    id: int
    name: str
    base_price: Decimal
    fabric_height: Decimal
    color_skus: List[ColorSKUOut] = []

    class Config:
        from_attributes = True

class ProductTypeOut(BaseModel):
    id: int
    name: str
    product_models: List[ProductModelOut] = []

    class Config:
        from_attributes = True

class TrackVisitCreate(BaseModel):
    source: str

class SearchResultOut(BaseModel):
    id: int
    name: str
    type_name: str
    price: Decimal
    image_url: Optional[str] = None
