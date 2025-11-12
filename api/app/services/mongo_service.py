# api/app/services/mongo_service.py
"""
Servicio Mongo con cliente perezoso y soporte de mongomock en tests.

- APP_ENV=test  -> usa mongomock (sin red)
- APP_ENV!=test -> usa Mongo real con MONGODB_URI
- Índices se crean vía init_indexes() (idempotente)

Notas de compatibilidad:
- tripId: se admite como ObjectId o str. Al guardar, si tiene forma válida de ObjectId,
  se almacena como ObjectId; si no, como str.
- ratings: se guarda tanto en 'rating' como en 'value' para compatibilidad con agregaciones
  existentes. Las estadísticas promedian (rating || value).
- add_comment: versión principal con parámetros (trip_id, text, ...). Se ofrece alias
  add_comment_doc(dict) para compatibilidad con código antiguo.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from bson import ObjectId
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError

# ---------------- Cliente perezoso ----------------

_client: Optional[MongoClient] = None


def _env(key: str, default: str) -> str:
    return os.getenv(key, default)


def get_client() -> MongoClient:
    """Devuelve un cliente; en tests usa mongomock."""
    global _client
    if _client is not None:
        return _client

    app_env = _env("APP_ENV", "dev").lower()
    if app_env == "test":
        import mongomock  # type: ignore
        _client = mongomock.MongoClient()
    else:
        uri = _env("MONGODB_URI", _env("MONGO_URI", "mongodb://localhost:27017"))
        _client = MongoClient(uri)

    return _client


def close_client() -> None:
    """Cierra el cliente si existe (en mongomock es no-op)."""
    global _client
    if _client is not None:
        try:
            _client.close()
        finally:
            _client = None


def get_db_name() -> str:
    # Compatibilidad con los dos nombres vistos
    return _env("MONGODB_DB", _env("MONGO_DB", "onedayonetrip"))


def get_db():
    return get_client()[get_db_name()]

# ---------------- Colecciones ----------------

def trips_collection() -> Collection:
    return get_db()["trips"]


def comments_collection() -> Collection:
    return get_db()["comments"]


def ratings_collection() -> Collection:
    return get_db()["ratings"]

# ---------------- Helpers ----------------

def _is_valid_objectid(value: str) -> bool:
    try:
        ObjectId(value)
        return True
    except Exception:
        return False


def _oid_or_str(value: str) -> Union[ObjectId, str]:
    """Convierte a ObjectId si es válido; si no, devuelve el str."""
    return ObjectId(value) if isinstance(value, str) and _is_valid_objectid(value) else value


def _to_public(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convierte _id->id y serializa ObjectId a str, sin mutar originales externos."""
    if not doc:
        return doc
    d = dict(doc)

    # Normaliza clave id
    if "_id" in d and isinstance(d["_id"], ObjectId):
        d["id"] = str(d["_id"])
        del d["_id"]

    # Normaliza tripId si es ObjectId
    if "tripId" in d and isinstance(d["tripId"], ObjectId):
        d["tripId"] = str(d["tripId"])

    return d

# ---------------- Índices (startup) ----------------

def init_indexes() -> None:
    """Crear índices necesarios (idempotente)."""
    # comments: por trip y fecha
    comments_collection().create_index(
        [("tripId", ASCENDING), ("createdAt", ASCENDING)],
        name="comments_trip_created_idx",
    )
    # trips: slug único si existe
    trips_collection().create_index(
        [("slug", ASCENDING)], unique=True, name="trips_slug_uq"
    )
    # ratings: consultas por trip
    ratings_collection().create_index(
        [("tripId", ASCENDING)], name="ratings_trip_idx"
    )
    # ratings: 1 rating por usuario y trip
    ratings_collection().create_index(
        [("tripId", ASCENDING), ("userId", ASCENDING)],
        unique=True,
        name="ratings_trip_user_uq",
    )

# ---------------- Trips ----------------

def save_trip(trip: Dict[str, Any]) -> Dict[str, Any]:
    """Inserta un viaje; levanta ValueError si hay duplicado (slug)."""
    col = trips_collection()
    try:
        res = col.insert_one(trip)
    except DuplicateKeyError as e:
        raise ValueError("duplicate_trip") from e

    inserted = col.find_one({"_id": res.inserted_id})
    return _to_public(inserted or {})


def get_all_trips(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    q = filters or {}
    docs = list(trips_collection().find(q))
    return [_to_public(d) for d in docs]


def get_trip_by_id(trip_id: str) -> Optional[Dict[str, Any]]:
    """Busca por ObjectId (si es válido) o por slug (fallback)."""
    # Intentar como ObjectId
    try:
        oid = ObjectId(trip_id)
        doc = trips_collection().find_one({"_id": oid})
        if doc:
            return _to_public(doc)
    except Exception:
        pass
    # Alternativa: tratar como slug
    doc = trips_collection().find_one({"slug": trip_id})
    if doc:
        return _to_public(doc)
    return None

# ---------------- Ratings ----------------

def upsert_rating(trip_id: str, user_id: Optional[str], rating: int, date: Optional[Union[str, datetime]] = None) -> Dict[str, Any]:
    """
    Inserta/actualiza el rating de un usuario para un trip.
    Compatibilidad:
      - Guarda tanto 'rating' como 'value' (idénticos) para soportar agregaciones existentes.
      - tripId admitido como ObjectId o str (se guarda como ObjectId si es válido).
    """
    col = ratings_collection()
    trip_key = _oid_or_str(trip_id)
    filter_q = {"tripId": trip_key, "userId": user_id}

    if isinstance(date, datetime):
        date_val = date.astimezone(timezone.utc).isoformat()
    elif isinstance(date, str):
        date_val = date
    else:
        date_val = datetime.now(timezone.utc).isoformat()

    update_q = {
        "$set": {
            "rating": int(rating),
            "value": int(rating),   # compatibilidad con pipelines antiguos
            "date": date_val,
        }
    }
    col.update_one(filter_q, update_q, upsert=True)
    doc = col.find_one(filter_q)
    return _to_public(doc or {})


def get_trip_rating_stats(trip_id: str) -> Dict[str, Any]:
    """
    Devuelve {'tripId': str, 'count': int, 'avg': float|None}
    Promedia sobre (rating || value) para compatibilidad.
    """
    col = ratings_collection()
    trip_key = _oid_or_str(trip_id)

    # Intentamos usar $ifNull para compatibilidad con docs antiguos.
    # Si el backend de tests no soporta $ifNull (p.ej. mongomock viejo),
    # caemos a una agregación simple sobre 'rating'.
    pipeline_ifnull: List[Dict[str, Any]] = [
        {"$match": {"tripId": trip_key}},
        {
            "$group": {
                "_id": "$tripId",
                "count": {"$sum": 1},
                "avg": {"$avg": {"$ifNull": ["$rating", "$value"]}},
            }
        },
    ]

    try:
        agg = list(col.aggregate(pipeline_ifnull))
    except Exception:
        pipeline_simple = [
            {"$match": {"tripId": trip_key}},
            {"$group": {"_id": "$tripId", "count": {"$sum": 1}, "avg": {"$avg": "$rating"}}},
        ]
        agg = list(col.aggregate(pipeline_simple))

    if not agg:
        return {"tripId": str(trip_id), "count": 0, "avg": None}

    row = agg[0]
    avg_val = row.get("avg")
    return {
        "tripId": str(row.get("_id", trip_id)),
        "count": int(row.get("count", 0) or 0),
        "avg": float(avg_val) if avg_val is not None else None,
    }

# ---------------- Comments ----------------

def add_comment(trip_id: str, text: str, user_id: Optional[str] = None, created_at: Optional[Union[str, datetime]] = None) -> Dict[str, Any]:
    """
    Crea un comentario sencillo.
    - tripId: se almacena como ObjectId si es válido, en caso contrario como str.
    - createdAt: ISO-8601 en UTC si no se indica.
    """
    if isinstance(created_at, datetime):
        created_iso = created_at.astimezone(timezone.utc).isoformat()
    elif isinstance(created_at, str):
        created_iso = created_at
    else:
        created_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "tripId": _oid_or_str(trip_id),
        "text": text,
        "userId": user_id,
        "createdAt": created_iso,
    }
    res = comments_collection().insert_one(doc)
    saved = comments_collection().find_one({"_id": res.inserted_id})
    return _to_public(saved or {})


# Alias de compatibilidad: add_comment(dict)
def add_comment_doc(doc: Dict[str, Any]) -> str:
    """
    Compatibilidad con la versión antigua que recibía un diccionario completo.
    Devuelve el id del nuevo comentario como str.
    Se asegura de convertir tripId adecuadamente.
    """
    payload = dict(doc)
    if "tripId" in payload:
        payload["tripId"] = _oid_or_str(str(payload["tripId"]))
    if "createdAt" not in payload:
        payload["createdAt"] = datetime.now(timezone.utc).isoformat()

    res = comments_collection().insert_one(payload)
    return str(res.inserted_id)


def list_comments(trip_id: str, limit: int = 20, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Lista comentarios por trip, ordenados por fecha ascendente.
    """
    cursor = (
        comments_collection()
        .find({"tripId": _oid_or_str(trip_id)})
        .sort("createdAt", ASCENDING)
        .skip(int(skip))
        .limit(int(limit))
    )
    return [_to_public(d) for d in cursor]
