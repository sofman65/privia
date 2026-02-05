from fastapi import APIRouter

router = APIRouter()


@router.get("/ping", tags=["chat"])
def chat_ping():
    return {"status": "ok"}
