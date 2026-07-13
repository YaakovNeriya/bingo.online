from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.database import get_db
from app.domains.users.models import User
from app.domains.admin.models import AuditLog

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        authorization: str = request.cookies.get("access_token")
        if authorization:
            return authorization
        # Fallback to header
        return await super().__call__(request)

oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl=f"{settings.API_V1_STR}/users/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def create_password_reset_token(email: str, hashed_password: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=1)
    # Include the last 10 chars of the hashed password to make the token single-use
    # If the password changes, the hash changes, and old tokens become invalid.
    pwd_chunk = hashed_password[-10:] if hashed_password else "nopwd"
    to_encode = {"exp": expire, "sub": email, "scope": "reset_password", "pwd": pwd_chunk}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_password_reset_token(token: str, current_hashed_password: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("scope") != "reset_password":
            return None
        pwd_chunk = current_hashed_password[-10:] if current_hashed_password else "nopwd"
        if payload.get("pwd") != pwd_chunk:
            return None
        return payload.get("sub")
    except Exception:
        return None

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    stmt = select(User).where(User.id == int(user_id))
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user is None:
        raise credentials_exception

    impersonate_id = request.headers.get("X-Impersonate-User")
    if impersonate_id and user.is_superuser:
        try:
            impersonate_id = int(impersonate_id)
            stmt_imp = select(User).where(User.id == impersonate_id)
            res_imp = await db.execute(stmt_imp)
            impersonated_user = res_imp.scalars().first()
            if impersonated_user:
                if request.method != "GET":
                    audit_log = AuditLog(
                        admin_id=user.id,
                        impersonated_user_id=impersonated_user.id,
                        endpoint=f"{request.method} {request.url.path}",
                        action="Impersonation Modification"
                    )
                    db.add(audit_log)
                    await db.commit()
                impersonated_user.is_impersonated_by_admin = True
                return impersonated_user
        except ValueError:
            pass

    return user

async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="The user doesn't have enough privileges"
        )
    return current_user
