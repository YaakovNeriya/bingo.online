from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    region_id: Optional[int] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class RegionCreate(BaseModel):
    name: str
    shipping_cost: float
    delivery_days: int

class RegionOut(BaseModel):
    id: int
    name: str
    shipping_cost: float
    delivery_days: int

    class Config:
        from_attributes = True

class GoogleAuthRequest(BaseModel):
    credential: str
