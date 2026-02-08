from pydantic import BaseModel
from typing import List, Optional


class QueryRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    mode: str
    conversation_id: str
    sources: List[str] = []
