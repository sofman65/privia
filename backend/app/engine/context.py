"""Chat context passed to the engine on every request."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass(frozen=True, slots=True)
class HistoryMessage:
    """A single turn in the conversation history."""

    role: str  # "user" | "assistant" | "system"
    content: str


@dataclass(frozen=True, slots=True)
class ChatContext:
    """
    Immutable snapshot of everything the engine needs to produce a response.

    Constructed by the API layer and handed to ``ChatEngine.answer()`` /
    ``ChatEngine.stream()``.  The engine never touches the database directly.
    """

    user_id: str
    conversation_id: Optional[str] = None
    history: List[HistoryMessage] = field(default_factory=list)
    model: Optional[str] = None  # reserved for model selection
    temperature: float = 0.1
    top_k: int = 6
