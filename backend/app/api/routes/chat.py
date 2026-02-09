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

from app.core.database import SessionLocal
from app.core.deps import get_db, get_current_user
from app.core.security import decode_jwt
from app.engine import get_engine, ChatContext, HistoryMessage
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.query import QueryRequest, QueryResponse

router = APIRouter(tags=["chat"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_ws_token(websocket: WebSocket) -> str | None:
    auth = websocket.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth.replace("Bearer ", "").strip()

    cookie_token = websocket.cookies.get("auth-token")
    if cookie_token:
        return cookie_token

    query_token = websocket.query_params.get("token")
    if query_token:
        return query_token

    return None


def _authenticate_ws_user(websocket: WebSocket) -> str | None:
    token = _extract_ws_token(websocket)
    if not token:
        return None

    try:
        payload = decode_jwt(token)
    except HTTPException:
        return None

    user_id = payload.get("sub")
    return str(user_id) if user_id else None


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


def _maybe_set_title_from_first_prompt(conv: Conversation, prompt: str) -> None:
    """
    Persist a conversation title from the first user prompt.

    The frontend can still update title optimistically, but backend persistence
    keeps titles correct after reload/hydration.
    """
    if conv.status != "empty":
        return

    current = (conv.title or "").strip()
    if current and current != "New conversation":
        return

    text = (prompt or "").strip()
    if not text:
        return

    conv.title = text[:40] + ("..." if len(text) > 40 else "")


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

    # Persist title from first prompt on backend
    _maybe_set_title_from_first_prompt(conv, payload.question)

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

    # Persist title from first prompt on backend
    _maybe_set_title_from_first_prompt(conv, payload.question)

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
    Authentication is required via Bearer token or auth-token cookie.
    """
    user_id = _authenticate_ws_user(websocket)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    engine = get_engine()
    db = SessionLocal()

    try:
        while True:
            message = await websocket.receive_text()
            conversation_id: str | None = None

            try:
                data = json.loads(message)
                if isinstance(data, dict) and data.get("type") == "stop":
                    continue
                if isinstance(data, dict):
                    question = str(data.get("question", ""))
                    conversation_id = data.get("conversation_id")
                else:
                    question = str(data)
            except json.JSONDecodeError:
                question = message

            if not question.strip():
                await websocket.send_json(
                    {"type": "error", "content": "Question is required"}
                )
                continue

            try:
                conv = _get_or_create_conversation(db, user_id, conversation_id)
                _maybe_set_title_from_first_prompt(conv, question)
                _activate_conversation(conv, db)

                db.add(Message(conversation_id=conv.id, role="user", content=question))
                db.commit()

                ctx = _build_context(user_id, conv)
                full = ""
                for chunk in engine.stream(question, ctx):
                    full += chunk
                    await websocket.send_json(
                        {
                            "type": "token",
                            "content": chunk,
                            "mode": "stream",
                        }
                    )

                resp = engine.last_response()
                db.add(
                    Message(
                        conversation_id=conv.id,
                        role="assistant",
                        content=full.strip(),
                    )
                )
                conv.updated_at = datetime.utcnow()
                db.commit()

                await websocket.send_json(
                    {
                        "type": "done",
                        "conversation_id": conv.id,
                        "sources": resp.sources,
                        "mode": resp.mode,
                    }
                )
            except HTTPException as exc:
                db.rollback()
                detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
                await websocket.send_json({"type": "error", "content": detail})
            except Exception as exc:  # pragma: no cover
                db.rollback()
                await websocket.send_json({"type": "error", "content": str(exc)})
    except WebSocketDisconnect:
        pass
    finally:
        db.close()
