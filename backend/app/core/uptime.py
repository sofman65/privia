from datetime import datetime, timezone
from fastapi import APIRouter

from app.core.config import settings
from app.core.uptime import get_uptime_seconds
from app.schemas import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version="0.1.0",
        env=settings.env,
        uptime_seconds=get_uptime_seconds(),
        timestamp=datetime.now(timezone.utc),
    )
