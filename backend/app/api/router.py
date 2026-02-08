from fastapi import APIRouter

from app.api.routes import auth, chat, conversations, health, scalar

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(chat.router)
api_router.include_router(conversations.router)
api_router.include_router(health.router, prefix="/health")
# Scalar docs are already on /scalar; don't double-prefix with /api
api_router.include_router(scalar.router)

router = api_router
