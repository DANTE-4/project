"""
auth/router.py — Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.database import get_db
from app.auth.schemas import UserRegisterRequest, UserResponse, TokenResponse
from app.auth.service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new patient account."""
    service = AuthService(db)
    user = await service.register(payload)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Login with email + password.
    Returns access_token in body; refresh_token in httpOnly cookie.
    """
    service = AuthService(db)
    tokens = await service.login(form_data.username, form_data.password)

    # Set refresh token as httpOnly cookie — NOT accessible to JS
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,           # HTTPS only
        samesite="strict",
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/api/v1/auth/refresh",
    )

    return TokenResponse(access_token=tokens["access_token"], token_type="bearer")


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Rotate access token using httpOnly refresh cookie."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )
    service = AuthService(db)
    tokens = await service.refresh(refresh_token)

    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=60 * 60 * 24 * 7,
        path="/api/v1/auth/refresh",
    )
    return TokenResponse(access_token=tokens["access_token"], token_type="bearer")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    """Clear the refresh token cookie."""
    response.delete_cookie(key="refresh_token", path="/api/v1/auth/refresh")
