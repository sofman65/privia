"""Chat endpoints: REST, SSE streaming, and WebSocket."""

from datetime import datetime
import json
from typing import Generator

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.engine import get_engine, ChatContext, HistoryMessage
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.query import QueryRequest, QueryResponse

router = APIRouter(tags=["chat"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_or_create_conversation(
    db: Session, user_id: str, conversation_id: str | None, title: str | None = None
) -> Conversation:
    if conversation_id:
        conv = db.get(Conversation, conversation_id)
        if not conv or conv.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        return conv

    # Reuse existing empty conversation (same idempotent rule as POST /conversations)
    existing = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id, Conversation.status == "empty")
        .first()
    )
    if existing:
        return existing

    conv = Conversation(user_id=user_id, title=title or "New conversation", status="empty")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _activate_conversation(conv: Conversation, db: Session) -> None:
    """Promote from 'empty' → 'active' on first user message."""
    if conv.status == "empty":
        conv.status = "active"
        db.flush()


def _build_context(
    user_id: str, conv: Conversation, limit: int = 20
) -> ChatContext:
    """Build a ChatContext from the persisted conversation history."""
    recent = conv.messages[-limit:] if conv.messages else []
    history = [HistoryMessage(role=m.role, content=m.content) for m in recent]
    return ChatContext(
        user_id=user_id,
        conversation_id=conv.id,
        history=history,
    )


# ---------------------------------------------------------------------------
# REST
# ---------------------------------------------------------------------------


@router.post("/query", response_model=QueryResponse, summary="Chat via REST")
def query_chat(
    payload: QueryRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_or_create_conversation(db, user_id, payload.conversation_id)

    # Promote empty → active on first user message
    _activate_conversation(conv, db)

    # Persist user message
    db.add(Message(conversation_id=conv.id, role="user", content=payload.question))
    db.flush()

    # Build context and call engine
    ctx = _build_context(user_id, conv)
    engine = get_engine()
    response = engine.answer(payload.question, ctx)

    # Persist assistant message
    db.add(
        Message(conversation_id=conv.id, role="assistant", content=response.content)
    )
    conv.updated_at = datetime.utcnow()
    db.commit()

    return QueryResponse(
        answer=response.content,
        mode=response.mode,
        sources=response.sources,
        conversation_id=conv.id,
    )


# ---------------------------------------------------------------------------
# SSE streaming
# ---------------------------------------------------------------------------


@router.post("/stream", summary="Chat stream (SSE)")
def stream_chat(
    payload: QueryRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_or_create_conversation(db, user_id, payload.conversation_id)

    # Promote empty → active on first user message
    _activate_conversation(conv, db)

    # Persist user prompt
    db.add(Message(conversation_id=conv.id, role="user", content=payload.question))
    db.commit()

    ctx = _build_context(user_id, conv)
    engine = get_engine()

    def event_stream() -> Generator[str, None, None]:
        full = ""
        for chunk in engine.stream(payload.question, ctx):
            full += chunk
            yield f"data: {chunk}\n\n"

        # Persist assistant message after streaming completes
        db.add(
            Message(
                conversation_id=conv.id,
                role="assistant",
                content=full.strip(),
            )
        )
        conv.updated_at = datetime.utcnow()
        db.commit()

        # Emit metadata from the engine response
        resp = engine.last_response()
        done_payload = {
            "conversation_id": conv.id,
            "mode": resp.mode,
            "sources": resp.sources,
        }
        yield "event: done\n"
        yield f"data: {json.dumps(done_payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------


@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    """
    WebSocket chat that streams tokens from the active ChatEngine.

    Authentication is not enforced on the WebSocket handshake yet.
    """
    await websocket.accept()
    engine = get_engine()

    try:
        while True:
            message = await websocket.receive_text()
            try:
                data = json.loads(message)
                if isinstance(data, dict) and data.get("type") == "stop":
                    continue
                question = data.get("question") if isinstance(data, dict) else str(data)
            except json.JSONDecodeError:
                question = message

            ctx = ChatContext(user_id="ws-anonymous")

            for chunk in engine.stream(question or "", ctx):
                await websocket.send_json(
                    {
                        "type": "token",
                        "content": chunk,
                        "mode": engine.last_response().mode
                        if hasattr(engine, "_last") and engine._last
                        else "stub",
                    }
                )

            resp = engine.last_response()
            await websocket.send_json(
                {
                    "type": "done",
                    "sources": resp.sources,
                    "mode": resp.mode,
                }
            )
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # pragma: no cover
        await websocket.send_json({"type": "error", "content": str(exc)})
