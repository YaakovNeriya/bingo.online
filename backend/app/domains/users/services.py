from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.users.models import User
from app.domains.users.schemas import UserCreate
from app.core.security import get_password_hash, verify_password
from app.core.exceptions import AppException
import string
import secrets

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
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
            await db.refresh(user)
            return user
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
    await db.refresh(db_obj)
    return db_obj

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def generate_random_password(length=16) -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for i in range(length))
