from fastapi import APIRouter

from app.api.routes import auth, chat, health, scalar

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
# Scalar docs are already on /scalar; don't double-prefix with /api
api_router.include_router(scalar.router, tags=["scalar"])

router = api_router
