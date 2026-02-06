from fastapi import APIRouter, Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer

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
def login():
    """
    Stub login endpoint.

    TODO:
    - verify credentials
    - issue JWT
    - store session
    """

    return {
        "access_token": "dev-token-not-secure",
        "token_type": "bearer",
        "user": {
            "id": "dev-user",
            "email": "dev@privia.app",
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
def me(token: str = Depends(oauth2_scheme)):
    """
    Stub profile endpoint.

    TODO:
    - validate JWT
    - load user from DB
    """

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return {
        "id": "dev-user",
        "email": "dev@privia.app",
        "full_name": "Dev User",
    }
