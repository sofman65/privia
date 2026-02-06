from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import StreamingResponse
from app.schemas.query import QueryRequest, QueryResponse
from app.schemas.conversation import ConversationOut
from app.core.conversations import (
    create_conversation,
    add_message,
    get_conversation,
)

from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.query import QueryRequest, QueryResponse

router = APIRouter()


# --------------------
# Schemas (local for now)
# --------------------


@router.get("/ping", tags=["chat"])
def chat_ping():
    return {"status": "ok"}


router = APIRouter()


@router.post("/query", response_model=QueryResponse)
def query_chat(
    payload: QueryRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.conversation_id:
        conv = db.get(Conversation, payload.conversation_id)
    else:
        conv = Conversation(user_id=user_id, title="New conversation")
        db.add(conv)
        db.commit()
        db.refresh(conv)

    db.add(Message(conversation_id=conv.id, role="user", content=payload.question))

    answer = f"Stub answer to: {payload.question}"
    db.add(Message(conversation_id=conv.id, role="assistant", content=answer))

    conv.updated_at = db.scalar("now()")
    db.commit()

    return QueryResponse(
        answer=answer,
        mode="stub",
        conversation_id=conv.id,
    )


@router.post(
    "/stream",
    tags=["chat"],
    summary="Chat stream (stub)",
)
def stream_chat(payload: QueryRequest):
    """
    Minimal SSE stub so the frontend doesn't 404. Emits one token and a done event.
    """

    def event_stream():
        yield f"data: Stub answer to: {payload.question}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    """
    Minimal WS stub so the frontend doesn't 403/404.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json(
                {
                    "type": "token",
                    "content": f"Stub answer to: {data}",
                    "mode": "stub",
                }
            )
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass


@router.post(
    "/conversations",
    response_model=ConversationOut,
    summary="Create conversation",
)
def create_chat_conversation(
    title: str = "New conversation",
):
    # Stubbed conversation response
    conv = create_conversation("stub-user", title)
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        messages=[],
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )
