def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()

    assert "status" in body
    assert "uptime" in body
    assert "env" in body
    assert "version" in body
