from datetime import datetime, timezone
import time

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()

# process-level uptime start
START_TIME = time.monotonic()


@router.get(
    "/",
    summary="Health check",
)
def health_check():
    return {
        "status": "ok",
        "version": "0.1.0",
        "env": settings.env,
        "uptime": round(time.monotonic() - START_TIME, 3),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
