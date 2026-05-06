"""
core/security.py — JWT creation/verification + password hashing
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


# ── Passwords ─────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(
        plain.encode("utf-8"),
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(
        plain.encode("utf-8"),
        hashed.encode("utf-8"),
    )


# ── JWT ───────────────────────────────────────────────────────────

def _create_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    payload["iat"] = datetime.now(timezone.utc)
    payload["jti"] = str(uuid.uuid4())
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_id: str, role: str) -> str:
    return _create_token(
        {"sub": user_id, "role": role, "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        {"sub": user_id, "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
