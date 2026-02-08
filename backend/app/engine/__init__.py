"""
Chat engine package.

Call ``get_engine()`` to obtain the active ``ChatEngine`` instance.
The default is ``StubChatEngine``; swap it for a real implementation by
changing the factory below.
"""

from __future__ import annotations

from functools import lru_cache

from app.engine.base import ChatEngine
from app.engine.stub import StubChatEngine
from app.engine.context import ChatContext, HistoryMessage
from app.engine.response import ChatResponse


@lru_cache(maxsize=1)
def get_engine() -> ChatEngine:
    """
    Factory that returns the singleton engine instance.

    To plug in a real model, replace ``StubChatEngine()`` with your
    implementation (e.g. ``OllamaEngine(model="gemma2:9b")``).
    """
    return StubChatEngine()


__all__ = [
    "ChatEngine",
    "StubChatEngine",
    "ChatContext",
    "ChatResponse",
    "HistoryMessage",
    "get_engine",
]
