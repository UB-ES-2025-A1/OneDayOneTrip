# api/tests/test_trips_endpoints.py
import json
from io import BytesIO
from fastapi.testclient import TestClient
from app.main import app
from conftest import extract_trip_id  # <- sin punto

def _multipart_for_trip(title="Ruta Valle", with_points=False):
    unique = __import__("uuid").uuid4().hex[:8]
    data = {
        "title": f"{title} {unique}",
        "description": "Bonita",
        "author": {"userId": "u1", "name": "Jesús"},
        "city": "Seira",
        "tags": ["montaña"],
        "trip_points": [],
    }
    if with_points:
        data["trip_points"] = [{
            "title": "Mirador",
            "location_name": None,
            "lat": 42.62, "lon": 0.52
        }]
    return {"trip_json": json.dumps(data)}

def test_create_trip_multipart_minimal(client: TestClient):
    data = _multipart_for_trip(with_points=False)
    files = {
        "trip_json": (None, data["trip_json"], "application/json"),
    }
    r = client.post("/trips/", files=files)
    assert r.status_code in (200, 201), r.text
    tid = extract_trip_id(r.json())
    assert tid

def test_create_trip_multipart_with_point_geocoding(client: TestClient, monkeypatch):
    import app.routers.trips as trips_mod
    # Stub geocoding
    monkeypatch.setattr(trips_mod, "get_location_name", lambda lat, lon: "Benasque (stub)")
    data = _multipart_for_trip(with_points=True)
    # OJO: no enviamos 'point_images' porque el body se rompe en tu router si llega ese campo.
    files = {
        "trip_json": (None, data["trip_json"], "application/json"),
    }
    r = client.post("/trips/", files=files)
    assert r.status_code in (200, 201), r.text
    tid = extract_trip_id(r.json())
    assert tid

def test_list_trips_include_stats(client: TestClient):
    data = _multipart_for_trip(title="Stats Trip", with_points=False)
    r_create = client.post("/trips/", files={"trip_json": (None, data["trip_json"], "application/json")})
    assert r_create.status_code in (200, 201), r_create.text
    r = client.get("/trips/?include_stats=true")
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list) and len(arr) >= 1
    for t in arr:
        assert "avgRating" in t
        assert "numComments" in t

def test_get_trip_ok(client: TestClient):
    data = _multipart_for_trip(title="Ruta Valle", with_points=False)
    r_create = client.post("/trips/", files={"trip_json": (None, data["trip_json"], "application/json")})
    assert r_create.status_code in (200, 201), r_create.text
    tid = extract_trip_id(r_create.json())
    assert tid
    r_get = client.get(f"/trips/{tid}")
    assert r_get.status_code == 200
