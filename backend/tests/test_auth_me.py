from jose import jwt

SECRET = "dev-secret-change-later"
ALG = "HS256"


def make_token():
    return jwt.encode(
        {"sub": "user_123", "email": "user@privia.app"},
        SECRET,
        algorithm=ALG,
    )


def test_me_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_authenticated(client):
    token = make_token()
    res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert res.status_code == 200
    data = res.json()

    assert data["id"] == "user_123"
    assert data["email"] == "user@privia.app"
