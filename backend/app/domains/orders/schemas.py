from pydantic import BaseModel, Field, field_validator, field_serializer
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

def _fmt_currency(v: Decimal) -> str:
    """Format Decimal to exactly 2 decimal places without float conversion."""
    return str(v.quantize(Decimal('0.01')))

class SimpleProductModelOut(BaseModel):
    id: int
    name: str
    base_price: Decimal
    fabric_height: Decimal

    @field_serializer('base_price')
    def serialize_base_price(self, v: Decimal) -> str:
        return _fmt_currency(v)

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
    color_sku_id: Optional[int] = None
    length_meters: Decimal
    units: int
    price_at_purchase: Decimal
    historical_product_name: Optional[str] = None
    historical_color_name: Optional[str] = None
    color_sku: Optional[CartColorSKUOut] = None

    @field_serializer('price_at_purchase')
    def serialize_price(self, v: Decimal) -> str:
        return _fmt_currency(v)

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    status: str
    total_price: Decimal
    created_at: datetime
    items: List[OrderItemOut] = []

    @field_serializer('total_price')
    def serialize_total_price(self, v: Decimal) -> str:
        return _fmt_currency(v)

    class Config:
        from_attributes = True
