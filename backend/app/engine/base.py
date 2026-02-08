"""Abstract base class for all chat engine implementations."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterator

from app.engine.context import ChatContext
from app.engine.response import ChatResponse


class ChatEngine(ABC):
    """
    Boundary between the API layer and whatever generates answers.

    Subclass this to plug in Ollama, OpenAI, a local transformer, or any
    retrieval-augmented pipeline.  The API routes never import model-specific
    code — they only depend on this interface.
    """

    @abstractmethod
    def answer(self, query: str, context: ChatContext) -> ChatResponse:
        """Return a complete answer synchronously."""
        ...

    @abstractmethod
    def stream(self, query: str, context: ChatContext) -> Iterator[str]:
        """
        Yield answer tokens one at a time for streaming endpoints.

        After the iterator is exhausted the caller may request the full
        ``ChatResponse`` via :meth:`last_response`.
        """
        ...

    def last_response(self) -> ChatResponse:
        """
        Return metadata for the most recent ``stream()`` call.

        Implementations should build the ``ChatResponse`` as tokens are
        yielded and cache it so this method can return it after the stream
        completes.
        """
        raise NotImplementedError(
            f"{type(self).__name__} does not support last_response()"
        )
