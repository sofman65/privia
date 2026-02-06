from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Request

from app.core.config import settings

ALGORITHM = "HS256"


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
