from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any, List

from app.db.database import get_db
from app.domains.users import schemas, services
from app.core.security import create_access_token, get_current_user
from app.core.config import settings
from app.core.rate_limit import limiter
from app.domains.users.models import User, Region

router = APIRouter()

@router.get("/regions", response_model=List[schemas.RegionOut])
async def get_regions(db: AsyncSession = Depends(get_db)):
    """
    Get all available regions.
    """
    stmt = select(Region)
    result = await db.execute(stmt)
    regions = result.scalars().all()
    return regions

from app.core.http_client import http_client
import httpx

@router.post("/auth/google")
@limiter.limit("5/minute")
async def google_auth(request: Request, auth_request: schemas.GoogleAuthRequest, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        # Verify Google access token by fetching userinfo
        try:
            resp = await http_client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {auth_request.credential}"},
                timeout=10.0
            )
            resp.raise_for_status()
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Google API connection error: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise ValueError(f"Invalid Google token (status {e.response.status_code})")
            
        idinfo = resp.json()
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')

        # Check if user exists
        user = await services.get_user_by_email(db, email=email)
        
        if user:
            if not user.is_active:
                raise HTTPException(status_code=400, detail="Inactive user")
            # Return token to log them in
            access_token = create_access_token(user.id)
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                samesite="lax",
                max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                secure=settings.ENVIRONMENT == "production"
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
            }
        else:
            # User doesn't exist, tell frontend to complete registration
            return {
                "status": "needs_registration",
                "email": email,
                "first_name": first_name,
                "last_name": last_name
            }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

@router.post("/register", response_model=schemas.UserOut)
@limiter.limit("5/minute")
async def register(
    request: Request,
    *,
    db: AsyncSession = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = await services.create_user(db, user_in=user_in)
    return user

@router.post("/login", response_model=schemas.Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await services.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=settings.ENVIRONMENT == "production"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing the access_token cookie.
    """
    response.delete_cookie(key="access_token", httponly=True, samesite="lax", secure=settings.ENVIRONMENT == "production")
    return {"message": "Successfully logged out"}

from app.core.exceptions import AppException

@router.get("/me", response_model=schemas.UserOut)
async def read_current_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get current user.
    """
    deadline = await services.get_user_deadline(db, current_user.id)
    # We can't mutate the SQLAlchemy object easily to add a property that satisfies Pydantic,
    # so we'll convert it to a dict, add the field, and let Pydantic handle it.
    user_dict = schemas.UserOut.model_validate(current_user).model_dump()
    user_dict["applicable_deadline"] = deadline
    return user_dict

@router.put("/me", response_model=schemas.UserOut)
async def update_current_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: schemas.UserUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current user profile.
    """
    try:
        updated_user = await services.update_user(db, user=current_user, user_in=user_in)
        deadline = await services.get_user_deadline(db, updated_user.id)
        user_dict = schemas.UserOut.model_validate(updated_user).model_dump()
        user_dict["applicable_deadline"] = deadline
        return user_dict
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)

from app.core.security import create_password_reset_token, verify_password_reset_token, get_password_hash
from app.utils.email_service import send_reset_password_email
import asyncio

@router.post("/password-recovery/{email}")
@limiter.limit("3/minute")
async def recover_password(
    request: Request,
    email: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Password Recovery.
    Always returns 200 OK to prevent user enumeration.
    """
    user = await services.get_user_by_email(db, email=email)
    
    # Get admin phone number to include in the email signature
    admin_user = await services.get_user_by_email(db, email=settings.ADMIN_EMAIL)
    admin_phone = admin_user.phone if admin_user and admin_user.phone else "050-000-0000"
    
    if user and user.is_active:
        token = create_password_reset_token(email=user.email, hashed_password=user.hashed_password)
        # Send email in background to not block the response
        asyncio.create_task(asyncio.to_thread(send_reset_password_email, user.email, token, admin_phone))

    return {"msg": "Password recovery email sent"}

@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: schemas.PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Reset password
    """
    # Verify token
    # We need the user to get their current hashed_password
    # Since we can't get the user without decoding the token, and the token verification needs the user's password,
    # we first decode without verification just to get the email, then fetch the user, then verify.
    from jose import jwt
    try:
        unverified_payload = jwt.decode(body.token, settings.SECRET_KEY, algorithms=["HS256"], options={"verify_signature": False})
        email = unverified_payload.get("sub")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid token")

    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = await services.get_user_by_email(db, email=email)
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid token")

    verified_email = verify_password_reset_token(body.token, user.hashed_password)
    if not verified_email:
        raise HTTPException(status_code=400, detail="Invalid token or token has already been used")

    user.hashed_password = get_password_hash(body.new_password)
    db.add(user)
    await db.commit()
    return {"msg": "Password updated successfully"}
