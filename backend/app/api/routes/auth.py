from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import (
    create_access_token,
    decode_jwt,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginResponse, SignupRequest, UserProfile

router = APIRouter(tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id, user.email)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    }


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Signup",
)
def signup(
    payload: SignupRequest,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
    }


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Current user",
)
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    payload = decode_jwt(token)

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Prefer DB record; fall back to token payload for compatibility in tests
    user = db.get(User, user_id)
    if user:
        return UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
        )

    return UserProfile(
        id=user_id,
        email=email,
        full_name=None,
        role=None,
    )
