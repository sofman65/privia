from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    mode: str
    conversation_id: str
