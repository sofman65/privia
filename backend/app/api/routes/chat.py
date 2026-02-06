from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from app.schemas.query import QueryRequest, QueryResponse

router = APIRouter()


# --------------------
# Schemas (local for now)
# --------------------


@router.get("/ping", tags=["chat"])
def chat_ping():
    return {"status": "ok"}


@router.post(
    "/query",
    response_model=QueryResponse,
    tags=["chat"],
    summary="Chat query (stub)",
)
def query_chat(payload: QueryRequest):
    """
    Stub chat endpoint.

    Authenticated.
    Stateless.
    No LLM yet.
    """

    return QueryResponse(
        answer=f"Stub answer to: {payload.question}",
        mode="stub",
    )


@router.post(
    "/stream",
    tags=["chat"],
    summary="Chat stream (stub)",
)
def stream_chat(payload: QueryRequest):
    """
    Minimal SSE stub so the frontend doesn't 404. Emits one token and a done event.
    """

    def event_stream():
        yield f"data: Stub answer to: {payload.question}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    """
    Minimal WS stub so the frontend doesn't 403/404.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json(
                {
                    "type": "token",
                    "content": f"Stub answer to: {data}",
                    "mode": "stub",
                }
            )
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass
