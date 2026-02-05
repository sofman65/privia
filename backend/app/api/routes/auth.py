from fastapi import APIRouter

router = APIRouter()


@router.get("/ping", tags=["auth"])
def auth_ping():
    return {"status": "ok"}
