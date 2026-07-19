from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.domains.users.models import User
from app.domains.users.schemas import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.exceptions import AppException
import string
import secrets

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    stmt = select(User).options(selectinload(User.region)).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    user = await get_user_by_email(db, email=user_in.email)
    if user:
        if user.region_id is None:
            user.first_name = user_in.first_name or user.first_name
            user.last_name = user_in.last_name or user.last_name
            user.phone = user_in.phone or user.phone
            user.region_id = user_in.region_id
            if user_in.password:
                user.hashed_password = get_password_hash(user_in.password)
            await db.commit()
            stmt = select(User).options(selectinload(User.region)).where(User.id == user.id)
            result = await db.execute(stmt)
            return result.scalars().first()
        else:
            raise AppException(status_code=400, detail="The user with this email already exists in the system.")
    
    pwd = user_in.password if user_in.password else generate_random_password()
    
    db_obj = User(
        email=user_in.email,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        hashed_password=get_password_hash(pwd),
        phone=user_in.phone,
        region_id=user_in.region_id,
        is_active=True,
        is_superuser=False,
    )
    db.add(db_obj)
    await db.commit()
    
    # Re-fetch the user with region eagerly loaded to prevent MissingGreenlet in Pydantic serialization
    stmt = select(User).options(selectinload(User.region)).where(User.id == db_obj.id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(characters) for i in range(length))

from typing import Optional
from datetime import datetime

async def get_user_deadline(db: AsyncSession, user_id: int) -> Optional[datetime]:
    from app.domains.admin.models import SiteSetting
    from sqlalchemy.orm import joinedload
    import dateutil.parser
    
    # Check if region has an override
    stmt = select(User).options(joinedload(User.region)).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if user and user.region and getattr(user.region, 'deadline_date', None):
        return user.region.deadline_date
        
    # Fallback to global deadline
    stmt = select(SiteSetting).where(SiteSetting.key == 'global_deadline')
    result = await db.execute(stmt)
    setting = result.scalars().first()
    
    if setting and setting.value:
        try:
            return dateutil.parser.isoparse(setting.value)
        except Exception as e:
            logger.warning(f"Failed to parse global_deadline value '{setting.value}': {e}. Treating as no deadline.")
            
    return None

async def update_user(db: AsyncSession, user: User, user_in: UserUpdate) -> User:
    if user_in.first_name is not None:
        user.first_name = user_in.first_name
    if user_in.last_name is not None:
        user.last_name = user_in.last_name
    if user_in.phone is not None:
        user.phone = user_in.phone
    if user_in.region_id is not None:
        user.region_id = user_in.region_id
        
    if user_in.password:
        is_impersonated = getattr(user, 'is_impersonated_by_admin', False)
        if not is_impersonated:
            if not user_in.current_password or not verify_password(user_in.current_password, user.hashed_password):
                raise AppException(status_code=400, detail="הסיסמה הנוכחית שהוזנה אינה נכונה")
        user.hashed_password = get_password_hash(user_in.password)
        
    await db.commit()
    stmt = select(User).options(selectinload(User.region)).where(User.id == user.id)
    result = await db.execute(stmt)
    return result.scalars().first()
