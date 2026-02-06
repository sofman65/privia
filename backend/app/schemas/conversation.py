from pydantic import BaseModel
from datetime import datetime
from typing import List


class MessageOut(BaseModel):
    role: str
    content: str
    timestamp: datetime


class ConversationOut(BaseModel):
    id: str
    title: str
    messages: List[MessageOut]
    created_at: datetime
    updated_at: datetime
