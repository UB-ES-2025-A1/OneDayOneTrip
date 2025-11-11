# api/tests/test_trips.py
from fastapi.testclient import TestClient
from app.main import app
import json

def test_get_trips_empty():
    with TestClient(app) as client:
        r = client.get("/trips/")  # nota la barra final
        assert r.status_code == 200
        assert r.json() == []

def test_post_trip_and_list():
    with TestClient(app) as client:
        trip = {
            "title": "Paris 3 días",
            "author": {"userId": "test-user", "name": "Test User"},
            "city": "Paris",
            # opcionales si quieres…
            # "description": "...",
            # "tags": ["arte"],
            # "trip_points": [{"title": "Louvre", "location_name": "Musée du Louvre"}],
        }

        # Enviar como multipart/form-data con el campo 'trip_json' (string JSON)
        r = client.post(
            "/trips/",
            files={
                # (filename=None → sin archivo real; contenido es la string JSON)
                "trip_json": (None, json.dumps(trip), "application/json"),
            },
        )
        assert r.status_code in (200, 201), r.text

        # Listar para comprobar
        r2 = client.get("/trips/")
        assert r2.status_code == 200
        data = r2.json()
        assert any(t.get("title") == "Paris 3 días" for t in data)
