from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
import phonenumbers

def validate_israeli_phone(v: Optional[str]) -> Optional[str]:
    if not v:
        return v
    try:
        parsed = phonenumbers.parse(v, "IL")
        if not phonenumbers.is_valid_number(parsed):
            raise ValueError("מספר טלפון לא תקין")
        return v
    except phonenumbers.NumberParseException:
        raise ValueError("פורמט טלפון לא תקין")

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    region_id: Optional[int] = None

class UserCreate(UserBase):
    password: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_israeli_phone(v)

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    region_id: Optional[int] = None
    password: Optional[str] = None
    current_password: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        return validate_israeli_phone(v)

class UserOut(UserBase):
    id: int
    is_active: bool
    is_superuser: bool
    applicable_deadline: Optional[datetime] = None
    region: Optional['RegionOut'] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class RegionCreate(BaseModel):
    name: str
    shipping_cost: Decimal
    delivery_days: int
    deadline_date: Optional[datetime] = None

class RegionOut(BaseModel):
    id: int
    name: str
    shipping_cost: Decimal
    delivery_days: int
    deadline_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class GoogleAuthRequest(BaseModel):
    credential: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
