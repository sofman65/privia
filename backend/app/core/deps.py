from fastapi import HTTPException, Request
from app.core.security import extract_token, decode_jwt


def get_current_user(request: Request):
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_jwt(token)
    return payload
