from fastapi import APIRouter

from app.api.routes import auth, chat, health

# Central API router that aggregates all sub-routers.
api_router = APIRouter()

api_router.include_router(auth.router, prefix="/api/auth", tags=["auth"])
api_router.include_router(chat.router, prefix="/api", tags=["chat"])
api_router.include_router(health.router, prefix="/api", tags=["health"])

# Backwards compatibility for any imports still referencing `router`.
router = api_router
