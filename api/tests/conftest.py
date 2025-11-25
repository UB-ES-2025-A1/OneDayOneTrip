# api/tests/conftest.py
import sys, os
import pytest

# Aseguramos que "api" está en el path (ahora estamos dentro de api/)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# 1️⃣ Importamos aquí el módulo con verify_token
from app.routers import users, trips
from _pytest.monkeypatch import MonkeyPatch

# 2️⃣ Mockeamos verify_token ANTES de crear la app
def fake_verify_token():
    return {"uid": "fake_uid", "email": "test@example.com"}

users.verify_token = fake_verify_token

def fake_upload_image_to_imgbb(file):  # Mock de subida de imágenes
    return f"https://fake.imgbb.com/{file.filename if file else 'no_file'}.jpg"

def fake_get_location_name(lat, lon):  # Mock del geocoding
    return f"FakeLocation({lat},{lon})"

def fake_save_trip(trip_data):  # Mock DB insert
    return "mock_trip_id_123"

def fake_get_all_trips():  # Mock DB read all
    return [
        {"_id": "t1", "title": "Trip 1", "country": "España"},
        {"_id": "t2", "title": "Trip 2", "country": "Francia"},
    ]

def fake_get_trip_by_id(trip_id):  # Mock DB read one
    if trip_id == "t1":
        return {"_id": "t1", "title": "Trip 1", "country": "España"}
    return None

def fake_get_trip_rating_stats(trip_id):  # Mock rating stats
    return {"avgRating": 4.5, "ratingsCount": 10}

def fake_upsert_rating(trip_id, userId, rating, date):  # Mock rating save
    return None

def fake_list_comments(trip_id, limit, skip):
    print(f"[MOCK] 🔥 fake_list_comments() llamado para trip_id={trip_id}")
    return [
        {"tripId": trip_id, "userId": "u1", "content": "Buen viaje"},
        {"tripId": trip_id, "userId": "u2", "content": "Me encantó"},
    ]

# 3️⃣ Ahora sí importamos la app (ya con el mock activo)
from app.main import app
from fastapi.testclient import TestClient

@pytest.fixture(scope="module")
def client():
    mp = MonkeyPatch()
    mp.setattr(trips, "upload_image_to_imgbb", fake_upload_image_to_imgbb)
    mp.setattr(trips, "get_location_name", fake_get_location_name)
    mp.setattr(trips, "save_trip", fake_save_trip)
    mp.setattr(trips, "get_all_trips", fake_get_all_trips)
    mp.setattr(trips, "get_trip_by_id", fake_get_trip_by_id)
    mp.setattr(trips, "get_trip_rating_stats", fake_get_trip_rating_stats)
    mp.setattr(trips, "upsert_rating", fake_upsert_rating)
    mp.setattr("app.routers.comments.list_comments", fake_list_comments)

    client = TestClient(app)
    yield client
    mp.undo()


@pytest.fixture(autouse=True)
def mock_firestore(monkeypatch):
    """Mock completo de Firestore."""
    class FakeDoc:
        def __init__(self, data=None):
            self._data = data or {}
            self.exists = bool(data)
        def to_dict(self): return self._data
        def set(self, data, merge=False):
            self._data.update(data)
            self.exists = True
        def get(self): return self

    class FakeCollection:
        def __init__(self): self._docs = {}
        def document(self, uid):
            if uid not in self._docs:
                self._docs[uid] = FakeDoc()
            return self._docs[uid]
        def get(self):
            return [
                FakeDoc({"uid": "fake1", "username": "user1"}),
                FakeDoc({"uid": "fake2", "username": "user2"}),
            ]

    class FakeDB:
        def collection(self, name): return FakeCollection()

    monkeypatch.setattr("app.routers.users.db", FakeDB())
