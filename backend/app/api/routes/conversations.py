"""Conversation CRUD endpoints."""

import time
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import (
    ConversationCreate,
    ConversationListItem,
    ConversationOut,
    ConversationUpdate,
    MessageOut,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])

# ---------------------------------------------------------------------------
# Layer 3 – Temporal rate limiting (in-memory, per user)
# ---------------------------------------------------------------------------
_NEW_CHAT_COOLDOWN = 3  # seconds
_last_create_ts: dict[str, float] = defaultdict(float)


def _check_rate_limit(user_id: str) -> None:
    """Raise 429 if the user created a conversation too recently."""
    now = time.monotonic()
    if now - _last_create_ts[user_id] < _NEW_CHAT_COOLDOWN:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many new chats. Please wait a few seconds.",
        )
    _last_create_ts[user_id] = now


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _conversation_out(conv: Conversation) -> ConversationOut:
    messages = [
        MessageOut(role=m.role, content=m.content, timestamp=m.timestamp)
        for m in conv.messages
    ]
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        status=conv.status,
        messages=messages,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


def _own_conversation(
    conversation_id: str, user_id: str, db: Session
) -> Conversation:
    """Fetch a conversation and verify ownership, or 404."""
    conv = db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conv


# ---------------------------------------------------------------------------
# Layer 2 – Idempotent CREATE (at most one empty conv per user)
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=ConversationOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create or return empty conversation",
)
def create_conversation(
    payload: ConversationCreate = ConversationCreate(),
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Idempotent new-chat endpoint.

    - If the user already has an **empty** (no user messages) conversation,
      return it instead of creating a new one.
    - Otherwise enforce rate-limit and create a fresh one.
    """
    existing = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id, Conversation.status == "empty")
        .first()
    )
    if existing:
        return _conversation_out(existing)

    # Layer 3 – rate check (only when actually creating)
    _check_rate_limit(user_id)

    conv = Conversation(
        user_id=user_id,
        title=payload.title or "New conversation",
        status="empty",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return _conversation_out(conv)


@router.get(
    "",
    response_model=List[ConversationListItem],
    summary="List conversations",
)
def list_conversations(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [
        ConversationListItem(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=len(c.messages),
        )
        for c in convs
    ]


@router.get(
    "/{conversation_id}",
    response_model=ConversationOut,
    summary="Get conversation with messages",
)
def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _own_conversation(conversation_id, user_id, db)
    return _conversation_out(conv)


@router.patch(
    "/{conversation_id}",
    response_model=ConversationOut,
    summary="Update conversation",
)
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _own_conversation(conversation_id, user_id, db)
    if payload.title is not None:
        conv.title = payload.title
    db.commit()
    db.refresh(conv)
    return _conversation_out(conv)


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete conversation",
)
def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = _own_conversation(conversation_id, user_id, db)
    db.delete(conv)
    db.commit()
