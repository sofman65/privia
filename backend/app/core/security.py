from datetime import datetime, timedelta
import hashlib
import secrets
from typing import Optional

from fastapi import HTTPException, status, Request
from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"
DEFAULT_EXP_MINUTES = 60 * 24  # 24h


def hash_password(password: str) -> str:
    """Return salted PBKDF2 hash for storage."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Verify password against stored salted hash."""
    try:
        salt, stored_hash = stored.split("$", 1)
    except ValueError:
        return False
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), 100_000
    ).hex()
    return secrets.compare_digest(candidate, stored_hash)


def create_access_token(
    user_id: str, email: str, expires_delta: Optional[timedelta] = None
) -> str:
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=DEFAULT_EXP_MINUTES)
    )
    to_encode = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[ALGORITHM],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def extract_token(request: Request) -> Optional[str]:
    #  Authorization header
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth.replace("Bearer ", "").strip()

    #  Cookie (future-proof)
    cookie = request.cookies.get("auth-token")
    if cookie:
        return cookie

    return None


def get_current_user_id(request: Request) -> str:
    """
    Lightweight dependency to pull user id from a Bearer token.
    Raises 401 on missing/invalid tokens.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    payload = decode_jwt(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    return user_id
