from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt

from app.core.config import settings
from app.core.security import decode_jwt, extract_token
from app.schemas.auth import LoginResponse, SignupRequest, UserProfile

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# --------------------
# Endpoints
# --------------------


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login (stub)",
)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Stub login endpoint.

    TODO:
    - verify credentials
    - issue JWT
    - store session
    """

    user_email = form_data.username or "dev@privia.app"
    token = jwt.encode(
        {"sub": "dev-user", "email": user_email},
        settings.secret_key,
        algorithm="HS256",
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": "dev-user",
            "email": user_email,
            "full_name": "Dev User",
        },
    }


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Signup (stub)",
)
def signup(payload: SignupRequest):
    """
    Stub signup endpoint.

    TODO:
    - validate uniqueness
    - hash password
    - persist user
    """

    return {
        "id": "dev-user",
        "email": payload.email,
        "full_name": payload.full_name,
    }


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Current user (stub)",
)
def get_current_user(request: Request):
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_jwt(token)

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return UserProfile(
        id=user_id,
        email=email,
        full_name="Privia User",
    )
