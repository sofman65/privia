"""Stub engine used when no real LLM pipeline is configured."""

from __future__ import annotations

from typing import Iterator

from app.engine.base import ChatEngine
from app.engine.context import ChatContext
from app.engine.response import ChatResponse

_STUB_REPLY = (
    "The LLM pipeline is not enabled in this deployment.  "
    "Connect an inference backend (Ollama, vLLM, OpenAI-compatible API) "
    "and swap StubChatEngine for a real implementation."
)


class StubChatEngine(ChatEngine):
    """
    Returns a fixed message explaining that no model is wired up.

    This is intentional: it communicates *system readiness*, not a fake
    answer.  Every field of ``ChatResponse`` is populated so the full
    contract is exercised end-to-end.
    """

    def __init__(self) -> None:
        self._last: ChatResponse | None = None

    def answer(self, query: str, context: ChatContext) -> ChatResponse:
        resp = ChatResponse(
            content=_STUB_REPLY,
            sources=[],
            mode="stub",
            confidence=0.0,
            model="stub",
        )
        self._last = resp
        return resp

    def stream(self, query: str, context: ChatContext) -> Iterator[str]:
        tokens = _STUB_REPLY.split(" ")
        full = ""
        for token in tokens:
            chunk = token + " "
            full += chunk
            yield chunk

        self._last = ChatResponse(
            content=full.strip(),
            sources=[],
            mode="stub",
            confidence=0.0,
            model="stub",
        )

    def last_response(self) -> ChatResponse:
        if self._last is None:
            raise RuntimeError("No stream() or answer() call has been made yet")
        return self._last
