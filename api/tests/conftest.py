# api/tests/conftest.py
import os
import sys
import types
import uuid
import datetime as _dt
import importlib
import pytest
from fastapi.testclient import TestClient

# --- Asegura que 'api' está en sys.path ---
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# =========================
# STUBS EN MEMORIA (SOLO TEST)
# =========================
_MEM = {"trips": [], "comments": [], "ratings": [], "firestore": {}}
# firestore: {(collection, doc_id): dict}

def _reset_mem():
    _MEM["trips"].clear()
    _MEM["comments"].clear()
    _MEM["ratings"].clear()
    _MEM["firestore"].clear()

def _new_id():
    return uuid.uuid4().hex[:24]

# --------- TRIPS ----------
def _save_trip(doc: dict) -> str:
    d = dict(doc)
    # Evita "duplicate" en el MISMO test: si existe por título, devuelve su id
    for t in _MEM["trips"]:
        if t.get("title") == d.get("title"):
            return t["id"]
    d.setdefault("id", _new_id())
    d.setdefault("_id", d["id"])  # algunos paths usan _id
    d.setdefault("avgRating", 0.0)
    d.setdefault("numComments", 0)
    d.setdefault("likes", 0)
    d.setdefault("createdAt", _dt.datetime.utcnow())
    d.setdefault("updatedAt", _dt.datetime.utcnow())
    _MEM["trips"].append(d)
    return d["id"]

def _get_all_trips():
    return [dict(t) for t in _MEM["trips"]]

def _get_trip_by_id(trip_id: str):
    for t in _MEM["trips"]:
        if t["id"] == trip_id or t.get("_id") == trip_id:
            return dict(t)
    return None

def _find_trip_by_title(title: str):
    for t in _MEM["trips"]:
        if t.get("title") == title:
            return dict(t)
    return None

# -------- COMMENTS ----------
def _add_comment_flexible(*args, **kwargs):
    """
    Acepta:
      - add_comment(trip_id, userId, userName, text)
      - add_comment({"tripId":..., "userId":..., "userName":..., "content"/"text":...})
    """
    if args and isinstance(args[0], dict) and not kwargs:
        doc = args[0]
        trip_id = doc.get("tripId") or doc.get("trip_id")
        userId = doc.get("userId")
        userName = doc.get("userName")
        text = doc.get("content") or doc.get("text")
    else:
        trip_id = kwargs.get("trip_id") or (args[0] if len(args) > 0 else None)
        userId = kwargs.get("userId")   or (args[1] if len(args) > 1 else None)
        userName = kwargs.get("userName") or (args[2] if len(args) > 2 else None)
        text = kwargs.get("text")       or (args[3] if len(args) > 3 else None)

    cid = _new_id()
    _MEM["comments"].append({
        "id": cid,
        "tripId": trip_id,
        "userId": userId,
        "userName": userName,
        "text": text,
        "createdAt": _dt.datetime.utcnow()
    })
    for t in _MEM["trips"]:
        if t["id"] == trip_id or t.get("_id") == trip_id:
            t["numComments"] = t.get("numComments", 0) + 1
            break
    return cid

def _get_comments_for_trip(trip_id: str):
    return [c for c in _MEM["comments"] if c["tripId"] == trip_id]

def _list_comments(trip_id: str):
    return _get_comments_for_trip(trip_id)

# -------- RATINGS ----------
def _add_rating(trip_id: str, user_id: str, rating: int):
    _MEM["ratings"].append({"tripId": trip_id, "userId": user_id, "rating": rating})

# --- REEMPLAZA la función existente por esta ---
def _upsert_rating(trip_id: str, user_id: str, rating: int, *_, **__):

    for r in _MEM["ratings"]:
        if r["tripId"] == trip_id and r["userId"] == user_id:
            r["rating"] = rating
            return
    _MEM["ratings"].append({"tripId": trip_id, "userId": user_id, "rating": rating})


def _get_ratings_for_trip(trip_id: str):
    return [r for r in _MEM["ratings"] if r["tripId"] == trip_id]

def _get_ratings_stats(trip_id: str):
    rs = _get_ratings_for_trip(trip_id)
    if not rs:
        return {"avg": 0.0, "num": 0}
    avg = sum(r["rating"] for r in rs) / len(rs)
    return {"avg": avg, "num": len(rs)}

_get_trip_rating_stats = _get_ratings_stats  # alias común

# ---- STUB: app.services.mongo_service ----
mongo_stub = types.ModuleType("app.services.mongo_service")
mongo_stub.init_indexes = _reset_mem
mongo_stub.close_client = lambda: None
mongo_stub.save_trip = _save_trip
mongo_stub.get_all_trips = _get_all_trips
mongo_stub.get_trip_by_id = _get_trip_by_id
mongo_stub.find_trip_by_title = _find_trip_by_title
mongo_stub.add_comment = _add_comment_flexible
mongo_stub.get_comments_for_trip = _get_comments_for_trip
mongo_stub.list_comments = _list_comments
mongo_stub.add_rating = _add_rating
mongo_stub.upsert_rating = _upsert_rating
mongo_stub.get_ratings_for_trip = _get_ratings_for_trip
mongo_stub.get_ratings_stats = _get_ratings_stats
mongo_stub.get_trip_rating_stats = _get_trip_rating_stats

# ---- STUB: app.services.image_service ----
image_stub = types.ModuleType("app.services.image_service")

def upload_image_to_imgbb(file_obj):
    return f"https://imgbb.test/{_new_id()}.jpg"

def upload_images_to_imgbb(files):
    return [upload_image_to_imgbb(f) for f in (files or [])]

def upload_gallery_to_imgbb(files):
    return upload_images_to_imgbb(files)

def upload_point_images_to_imgbb(files):
    return upload_images_to_imgbb(files)

image_stub.upload_image_to_imgbb = upload_image_to_imgbb
image_stub.upload_images_to_imgbb = upload_images_to_imgbb
image_stub.upload_gallery_to_imgbb = upload_gallery_to_imgbb
image_stub.upload_point_images_to_imgbb = upload_point_images_to_imgbb

# ---- STUB: app.services.firebase_service (db en memoria tipo Firestore) ----
fs_stub = types.ModuleType("app.services.firebase_service")

class _FSGetResult:
    def __init__(self, data):
        self._data = data
        self.exists = data is not None
    def to_dict(self):
        return dict(self._data) if self._data is not None else None

class _FSDoc:
    def __init__(self, collection: str, doc_id: str):
        self._c = collection
        self._id = doc_id
    def set(self, data: dict):
        _MEM["firestore"][(self._c, self._id)] = dict(data)
    def update(self, data: dict):
        cur = _MEM["firestore"].get((self._c, self._id), {})
        cur.update(dict(data))
        _MEM["firestore"][(self._c, self._id)] = cur
    def delete(self):
        _MEM["firestore"].pop((self._c, self._id), None)
    def get(self):
        data = _MEM["firestore"].get((self._c, self._id))
        return _FSGetResult(data)

class _FSCollection:
    def __init__(self, name: str):
        self._name = name
    def document(self, doc_id: str):
        return _FSDoc(self._name, doc_id)
    # helpers mínimos por si el código los usa
    def add(self, data: dict):
        new_id = _new_id()
        _FSDoc(self._name, new_id).set(data)
        return (None, new_id)

class _FSDB:
    def collection(self, name: str):
        return _FSCollection(name)
    # RTDB-like API por si el código usa reference()
    class _Ref:
        def __init__(self, path: str):
            self._path = tuple(p for p in path.strip("/").split("/") if p)
        def child(self, name):
            return _FSDB._Ref("/".join(list(self._path) + [name]))
        def set(self, data):
            key = tuple(self._path)
            _MEM["firestore"][(key[0], "/".join(key[1:]) or "root")] = dict(data)
        def get(self):
            key = tuple(self._path)
            data = _MEM["firestore"].get((key[0], "/".join(key[1:]) or "root"))
            return data
    def reference(self, path: str):
        return _FSDB._Ref(path)

fs_stub.db = _FSDB()

# Inserta submódulos stub
sys.modules["app.services.mongo_service"] = mongo_stub
sys.modules["app.services.image_service"] = image_stub
sys.modules["app.services.firebase_service"] = fs_stub

# PUBLICA TAMBIÉN EL PAQUETE PADRE 'app.services'
services_pkg = sys.modules.get("app.services")
if services_pkg is None:
    services_pkg = types.ModuleType("app.services")
    services_pkg.__path__ = []  # marcar como paquete
    sys.modules["app.services"] = services_pkg
setattr(services_pkg, "mongo_service", mongo_stub)
setattr(services_pkg, "image_service", image_stub)
setattr(services_pkg, "firebase_service", fs_stub)

# ---- STUB FIREBASE ADMIN AUTH (para evitar 401 en /users) ----
firebase_admin = types.ModuleType("firebase_admin")
firebase_auth = types.ModuleType("firebase_admin.auth")

def _verify_id_token(token, *_, **__):
    if not token:
        raise ValueError("invalid token")
    return {"uid": "test-user"}

firebase_auth.verify_id_token = _verify_id_token
firebase_admin.auth = firebase_auth
firebase_admin.initialize_app = lambda *a, **k: None
firebase_admin.credentials = types.SimpleNamespace(Certificate=lambda *a, **k: None)

sys.modules["firebase_admin"] = firebase_admin
sys.modules["firebase_admin.auth"] = firebase_auth

# ======================
# Carga la FastAPI "app"
# ======================
app_main = importlib.import_module("app.main")
app = app_main.app

# Si el router de users usa dependencias propias, intenta overrides best-effort
try:
    users_mod = importlib.import_module("app.routers.users")
    def _dummy_auth(*_a, **_k):
        return {"uid": "test-user"}
    for name in dir(users_mod):
        obj = getattr(users_mod, name)
        if callable(obj) and any(k in name.lower() for k in ("auth", "token", "current_user", "verify")):
            try:
                app.dependency_overrides[obj] = _dummy_auth
            except Exception:
                pass
except Exception:
    pass

# ===========
# FIXTURES
# ===========
@pytest.fixture()
def client():
    _reset_mem()  # DB en memoria limpia ANTES de cada test (no toca tu DB real)
    with TestClient(app) as c:
        yield c

# Helper utilizable por los tests
def extract_trip_id(resp_json: dict):
    if not isinstance(resp_json, dict):
        return None
    return (
        resp_json.get("trip_id")
        or resp_json.get("id")
        or resp_json.get("_id")
        or (resp_json.get("trip") or {}).get("id")
        or (resp_json.get("trip") or {}).get("_id")
    )
