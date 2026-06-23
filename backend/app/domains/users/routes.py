from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any, List
from google.oauth2 import id_token
from google.auth.transport import requests

from app.db.database import get_db
from app.domains.users import schemas, services
from app.core.security import create_access_token, get_current_user
from app.core.config import settings
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

@router.post("/auth/google")
async def google_auth(request: schemas.GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Verify Google access token by fetching userinfo
        import requests as httprequests
        resp = httprequests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {request.credential}"}
        )
        if resp.status_code != 200:
            raise ValueError("Invalid Google token")
            
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
            return {
                "access_token": create_access_token(user.id),
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
async def register(
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
async def login_access_token(
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
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }

@router.get("/me", response_model=schemas.UserOut)
async def read_current_user(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user.
    """
    return current_user
