from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from app.domains.products.schemas import ColorSKUOut

class CartItemAdd(BaseModel):
    color_sku_id: int
    length_meters: Decimal = Field(..., ge=0.1)
    units: int = Field(default=1, ge=1)

    @field_validator('length_meters')
    def validate_increment(cls, v):
        if v % Decimal('0.1') != 0:
            raise ValueError("Length must be in increments of 0.1 meters")
        return v

class CartItemUpdate(BaseModel):
    units: Optional[int] = Field(None, ge=1)
    length_meters: Optional[Decimal] = Field(None, ge=0.1)

    @field_validator('length_meters')
    def validate_increment(cls, v):
        if v is not None and v % Decimal('0.1') != 0:
            raise ValueError("Length must be in increments of 0.1 meters")
        return v

class SimpleProductModelOut(BaseModel):
    id: int
    name: str
    base_price: Decimal
    fabric_height: Decimal

    class Config:
        from_attributes = True

class CartColorSKUOut(ColorSKUOut):
    product_model: SimpleProductModelOut

class CartItemOut(BaseModel):
    id: int
    length_meters: Decimal
    units: int
    status: str
    color_sku: CartColorSKUOut

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    id: int
    items: List[CartItemOut] = []

    class Config:
        from_attributes = True

class CheckoutRequest(BaseModel):
    selected_item_ids: List[int]

class OrderItemOut(BaseModel):
    id: int
    length_meters: Decimal
    units: int
    price_at_purchase: Decimal
    historical_product_name: Optional[str] = None
    historical_color_name: Optional[str] = None
    color_sku: Optional[CartColorSKUOut] = None

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    status: str
    total_price: Decimal
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True
