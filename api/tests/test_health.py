# api/tests/test_health.py
from fastapi.testclient import TestClient
from app.main import app


def test_docs_alive():
    with TestClient(app) as client:
        r = client.get("/docs")
        assert r.status_code == 200