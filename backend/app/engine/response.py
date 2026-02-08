"""Structured response returned by every ChatEngine implementation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass(slots=True)
class ChatResponse:
    """
    The contract between the engine and the API layer.

    Every engine — stub, local model, hosted API — must populate these fields.
    The API layer serialises them into REST / SSE / WebSocket payloads.
    """

    content: str
    sources: List[str] = field(default_factory=list)
    mode: str = "chat"  # "chat" | "rag" | "echo"
    confidence: float = 0.0
    model: Optional[str] = None
