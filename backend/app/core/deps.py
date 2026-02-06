from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import get_current_user_id


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request) -> str:
    """FastAPI dependency to return authenticated user's id from Bearer token."""
    return get_current_user_id(request)
