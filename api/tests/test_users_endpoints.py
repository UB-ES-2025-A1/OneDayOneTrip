# api/tests/test_users_endpoints.py
from fastapi.testclient import TestClient
from app.main import app

def test_users_register_and_get(client: TestClient):
    payload = {"fullname":"Jesús", "username":"jesusrun", "mail":"j@ex.com"}

    r = client.post("/users/register?_a=x&_k=y", json=payload, headers={"Authorization":"Bearer FAKE"})
    assert r.status_code in (200, 201), r.text

    r2 = client.get("/users/me?_a=x&_k=y", headers={"Authorization":"Bearer FAKE"})
    assert r2.status_code in (200, 404), r2.text
