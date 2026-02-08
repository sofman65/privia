from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class MessageOut(BaseModel):
    role: str
    content: str
    timestamp: datetime


class ConversationOut(BaseModel):
    id: str
    title: str
    status: str = "empty"
    messages: List[MessageOut]
    created_at: datetime
    updated_at: datetime


class ConversationListItem(BaseModel):
    """Lightweight representation for the sidebar / list view."""

    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationCreate(BaseModel):
    """Optional body when creating a new conversation."""

    title: Optional[str] = None


class ConversationUpdate(BaseModel):
    """Fields the client may PATCH on a conversation."""

    title: Optional[str] = None
