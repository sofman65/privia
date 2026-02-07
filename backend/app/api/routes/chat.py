from datetime import datetime
import json
from typing import Generator, Iterable

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
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import ConversationOut, MessageOut
from app.schemas.query import QueryRequest, QueryResponse

router = APIRouter(tags=["chat"])


# Helpers -----------------------------------------------------------------


def _generate_answer(question: str) -> str:
    """Placeholder answer generator. Replace with real model/RAG later."""
    return f"Here is a concise answer to your question: {question}"


def _stream_tokens(text: str) -> Iterable[str]:
    """Yield small chunks to simulate token streaming."""
    for token in text.split(" "):
        yield token + " "


def _get_or_create_conversation(
    db: Session, user_id: str, conversation_id: str | None, title: str | None = None
) -> Conversation:
    if conversation_id:
        conv = db.get(Conversation, conversation_id)
        if not conv or conv.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
            )
        return conv

    conv = Conversation(user_id=user_id, title=title or "New conversation")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _conversation_out(conv: Conversation) -> ConversationOut:
    messages = [
        MessageOut(role=m.role, content=m.content, timestamp=m.timestamp)
        for m in conv.messages
    ]
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        messages=messages,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


# REST endpoints ----------------------------------------------------------


@router.post("/query", response_model=QueryResponse, summary="Chat via REST")
def query_chat(
    payload: QueryRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_or_create_conversation(db, user_id, payload.conversation_id)

    db.add(Message(conversation_id=conv.id, role="user", content=payload.question))

    answer = _generate_answer(payload.question)
    db.add(Message(conversation_id=conv.id, role="assistant", content=answer))

    conv.updated_at = datetime.utcnow()
    db.commit()

    return QueryResponse(
        answer=answer,
        mode="echo",
        conversation_id=conv.id,
    )


@router.post(
    "/stream",
    summary="Chat stream (SSE)",
)
def stream_chat(
    payload: QueryRequest,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_or_create_conversation(db, user_id, payload.conversation_id)

    # Persist user prompt
    db.add(Message(conversation_id=conv.id, role="user", content=payload.question))
    db.commit()

    answer = _generate_answer(payload.question)

    def event_stream() -> Generator[str, None, None]:
        full = ""
        for chunk in _stream_tokens(answer):
            full += chunk
            yield f"data: {chunk}\n\n"

        # Persist assistant message after streaming
        db.add(Message(conversation_id=conv.id, role="assistant", content=full.strip()))
        conv.updated_at = datetime.utcnow()
        db.commit()

        done_payload = {"conversation_id": conv.id, "mode": "echo"}
        yield "event: done\n"
        yield f"data: {json.dumps(done_payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post(
    "/conversations",
    response_model=ConversationOut,
    summary="Create conversation",
)
def create_chat_conversation(
    title: str | None = None,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _get_or_create_conversation(db, user_id, None, title=title)
    return _conversation_out(conv)


# WebSocket endpoint ------------------------------------------------------


@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    """
    Simple WebSocket chat that streams generated tokens.
    Authentication is not enforced yet; consider upgrading once frontend sends tokens.
    """
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            try:
                data = json.loads(message)
                question = data.get("question") if isinstance(data, dict) else str(data)
            except json.JSONDecodeError:
                question = message

            answer = _generate_answer(question)
            for chunk in _stream_tokens(answer):
                await websocket.send_json(
                    {
                        "type": "token",
                        "content": chunk,
                        "mode": "echo",
                    }
                )
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # pragma: no cover - defensive
        await websocket.send_json({"type": "error", "content": str(exc)})
