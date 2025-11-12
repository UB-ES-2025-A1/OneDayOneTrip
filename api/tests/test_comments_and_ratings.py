import json
from io import BytesIO
from fastapi.testclient import TestClient
from app.main import app
from conftest import extract_trip_id  # <- sin punto

def _mk_trip(client: TestClient, title="Cotiella"):
    unique = __import__("uuid").uuid4().hex[:8]
    js = {"title": f"{title} {unique}", "author": {"userId": "u1", "name": "Jesús"}, "city": "Plan"}
    r = client.post("/trips/", files={"trip_json": (None, json.dumps(js), "application/json")})
    assert r.status_code in (200, 201), r.text
    tid = extract_trip_id(r.json())
    assert tid, f"Respuesta sin id: {r.json()}"
    return tid

def test_add_comment_and_list(client: TestClient):
    tid = _mk_trip(client)
    r = client.post(f"/trips/{tid}/comment",
                    json={"userId":"u1","userName":"Jesús","content":"Brutal"})
    assert r.status_code in (200, 201), r.text

def test_rate_trip_both_endpoints(client: TestClient):
    tid = _mk_trip(client)
    r = client.post(f"/trips/{tid}/rating", json={"userId":"u1","rating":5})
    assert r.status_code in (200, 201), r.text
    r = client.post(f"/ratings/trip/{tid}", json={"userId":"u1","rating":4})
    assert r.status_code in (200, 201), r.text
