import json
from fastapi.testclient import TestClient
from app.main import app
from conftest import extract_trip_id  # <- sin punto

def test_get_trips_empty(client: TestClient):
    r = client.get("/trips/")
    assert r.status_code == 200
    assert r.json() == []

def test_post_trip_and_list(client: TestClient):
    trip = {
        "title": f"Paris 3 días {__import__('uuid').uuid4().hex[:6]}",
        "author": {"userId": "test-user", "name": "Test User"},
        "city": "Paris",
    }
    r = client.post("/trips/", files={"trip_json": (None, json.dumps(trip), "application/json")})
    assert r.status_code in (200, 201), r.text
    tid = extract_trip_id(r.json())
    assert tid

    r2 = client.get("/trips/")
    assert r2.status_code == 200
    arr = r2.json()
    assert isinstance(arr, list) and len(arr) >= 1
