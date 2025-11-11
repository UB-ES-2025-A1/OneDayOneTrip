# test_trips_endpoints.py
import json
from io import BytesIO

def _multipart_for_trip(title="Ruta Pirineo", with_points=True):
    base = {
        "title": title,
        "description": "Bonita",
        "author": {"userId":"u1","name":"Jesús"},
        "city": "Seira",
        "tags": ["montaña"],
        "trip_points": []
    }
    if with_points:
        base["trip_points"] = [
            {"title":"P1","description":"cascada","coordinates":{"lat":42.5,"lng":0.5}}
        ]
    return {"trip_json": json.dumps(base)}

def test_list_trips_empty(client):
    r = client.get("/trips/")
    assert r.status_code == 200
    assert r.json() == []

def test_create_trip_multipart_minimal(client):
    data = _multipart_for_trip(with_points=False)
    files = {
        "trip_json": (None, data["trip_json"]),
        "cover": ("cover.jpg", BytesIO(b"abc"), "image/jpeg"),
        "gallery": [("g1.jpg", BytesIO(b"123"), "image/jpeg"),
                    ("g2.jpg", BytesIO(b"456"), "image/jpeg")],
    }
    r = client.post("/trips/", files=files)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["message"] == "Trip creada correctamente"
    assert body["trip_id"].startswith("trip_")
    assert body["trip"]["title"] == "Ruta Pirineo"

def test_create_trip_multipart_with_point_geocoding(client, monkeypatch):
    # mock directo de la función get_location_name del módulo trips
    import app.routers.trips as trips_mod
    monkeypatch.setattr(trips_mod, "get_location_name", lambda lat, lon: "Benasque (stub)")
    data = _multipart_for_trip(with_points=True)
    files = {
        "trip_json": (None, data["trip_json"]),
        "point_images": [("p1.jpg", BytesIO(b"xyz"), "image/jpeg")],
    }
    r = client.post("/trips/", files=files)
    assert r.status_code == 200
    trip = r.json()["trip"]
    assert trip["trip_points"][0]["location_name"] == "Benasque (stub)"
    assert trip["trip_points"][0]["image"].endswith("p1.jpg")

def test_list_trips_include_stats(client):
    # tras crear, pedir include_stats debe añadir avg/num
    r = client.get("/trips/?include_stats=true")
    assert r.status_code == 200
    trips = r.json()
    assert isinstance(trips, list)
    assert "avgRating" in trips[0] and "numRatings" in trips[0]

def test_get_trip_not_found(client):
    r = client.get("/trips/does_not_exist")
    assert r.status_code == 404

def test_get_trip_ok(client):
    # Crear una trip y luego recuperarla
    data = _multipart_for_trip(title="Ruta Valle", with_points=False)
    r_create = client.post("/trips/", files={"trip_json": (None, data["trip_json"])})
    tid = r_create.json()["trip_id"]
    r = client.get(f"/trips/{tid}")
    assert r.status_code == 200
    got = r.json()
    assert got["_id"] == tid
    assert "avgRating" in got
