import uuid

from fastapi import status
import pytest
from starlette.websockets import WebSocketDisconnect


def _signup_and_login(client):
    email = f"ws-{uuid.uuid4()}@privia.app"
    password = "test1234"

    signup_res = client.post(
        "/api/auth/signup",
        json={
            "email": email,
            "password": password,
            "full_name": "WS Test",
        },
    )
    assert signup_res.status_code == status.HTTP_201_CREATED

    login_res = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
    )
    assert login_res.status_code == status.HTTP_200_OK
    return login_res.json()["access_token"]


def test_ws_requires_auth(client):
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/api/ws/chat"):
            pass

    assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION


def test_ws_persists_messages(client):
    token = _signup_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/api/conversations", json={}, headers=headers)
    assert create_res.status_code == status.HTTP_201_CREATED
    conversation_id = create_res.json()["id"]

    with client.websocket_connect(f"/api/ws/chat?token={token}") as websocket:
        websocket.send_json(
            {
                "question": "hello over websocket",
                "conversation_id": conversation_id,
            }
        )

        done_payload = None
        for _ in range(200):
            payload = websocket.receive_json()
            if payload.get("type") == "done":
                done_payload = payload
                break

        assert done_payload is not None
        assert done_payload["conversation_id"] == conversation_id
        assert done_payload.get("mode")

    conversation_res = client.get(
        f"/api/conversations/{conversation_id}",
        headers=headers,
    )
    assert conversation_res.status_code == status.HTTP_200_OK
    body = conversation_res.json()
    assert len(body["messages"]) >= 2
    assert body["messages"][-2]["role"] == "user"
    assert body["messages"][-1]["role"] == "assistant"
