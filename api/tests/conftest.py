# conftest.py
import sys, types, json
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

# --- Stubs para evitar efectos externos (Mongo, ImgBB, Geocoding, Firebase) ---
def _mk_mongo_stub():
    stub = types.SimpleNamespace()
    # storage en memoria
    _TRIPS = {}
    _COMMENTS = {}
    _RATINGS = {}

    def save_trip(trip: dict) -> str:
        _id = f"trip_{len(_TRIPS)+1}"
        trip_copy = dict(trip)
        trip_copy["_id"] = _id
        _TRIPS[_id] = trip_copy
        return _id

    def get_all_trips():
        return list(_TRIPS.values())

    def get_trip_by_id(trip_id: str):
        return _TRIPS.get(trip_id)

    def get_trip_rating_stats(trip_id: str):
        vals = [r["rating"] for r in _RATINGS.get(trip_id, {}).values()]
        if not vals:
            return {"avgRating": 0.0, "numRatings": 0}
        return {"avgRating": round(sum(vals)/len(vals), 2), "numRatings": len(vals)}

    def upsert_rating(trip_id: str, user_id: str, rating: int, date):
        _RATINGS.setdefault(trip_id, {})[user_id] = {"rating": rating, "date": date}

    def add_comment(doc: dict) -> str:
        cid = f"c_{sum(len(v) for v in _COMMENTS.values())+1}"
        _COMMENTS.setdefault(doc["tripId"], []).append({"_id": cid, **doc})
        return cid

    def list_comments(trip_id: str, limit: int = 20, skip: int = 0):
        allc = _COMMENTS.get(trip_id, [])
        return allc[skip:skip+limit]

    # export
    stub.save_trip = save_trip
    stub.get_all_trips = get_all_trips
    stub.get_trip_by_id = get_trip_by_id
    stub.get_trip_rating_stats = get_trip_rating_stats
    stub.upsert_rating = upsert_rating
    stub.add_comment = add_comment
    stub.list_comments = list_comments
    return stub

def _mk_image_stub():
    stub = types.SimpleNamespace()
    def upload_image_to_imgbb(file):
        return f"https://imgbb.test/{getattr(file, 'filename', 'image')}"
    stub.upload_image_to_imgbb = upload_image_to_imgbb
    return stub

def _mk_users_firebase_stub():
    # stub mínimo para tests opcionales de /users
    class _Doc:
        def __init__(self, d): self._d = d
        def to_dict(self): return self._d
        @property
        def exists(self): return True
    class _Col:
        def __init__(self): self._store = {}
        def document(self, uid):
            class _DocRef:
                def __init__(self, parent, uid): self.parent, self.uid = parent, uid
                def set(self, data): self.parent._store[self.uid] = data
                def get(self): return _Doc(self.parent._store.get(self.uid, {"uid": self.uid}))
            return _DocRef(self, uid)
        def get(self): return [_Doc(v) for v in self._store.values()]
    class _DB:
        def __init__(self): self._cols = {"users": _Col()}
        def collection(self, name): return self._cols[name]
    db = _DB()
    firebase_stub = types.SimpleNamespace(db=db)
    return firebase_stub

@pytest.fixture(scope="session")
def test_app():
    # Inyectar stubs ANTES de importar los routers
    sys.modules['app.services.mongo_service'] = _mk_mongo_stub()
    sys.modules['app.services.image_service'] = _mk_image_stub()
    # Evitar dependencia real de Firebase/verify_token
    sys.modules['app.services.firebase_service'] = _mk_users_firebase_stub()
    verify_stub = types.SimpleNamespace(verify_token=lambda request: {"uid":"u1"})
    sys.modules['app.auth.verify_token'] = verify_stub

    # Importar routers reales ahora que los stubs están puestos
    from app.routers import trips, ratings, users

    app = FastAPI(title="Test API")
    app.include_router(trips.router)
    app.include_router(ratings.router)
    app.include_router(users.router)
    return app

@pytest.fixture
def client(test_app):
    return TestClient(test_app)
