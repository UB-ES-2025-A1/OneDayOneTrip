# api/app/services/mongo_service.py
"""
Servicio Mongo con cliente perezoso y soporte de mongomock en tests.

- APP_ENV=test  -> usa mongomock (sin red)
- APP_ENV!=test -> usa Mongo real con MONGODB_URI
- Índices se crean vía init_indexes() (idempotente)
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

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
        uri = _env("MONGODB_URI", "mongodb://localhost:27017")
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
    return _env("MONGODB_DB", "onedayonetrip")


def get_db():
    return get_client()[get_db_name()]

# ---------------- Colecciones ----------------

def trips_collection() -> Collection:
    return get_db()["trips"]


def comments_collection() -> Collection:
    return get_db()["comments"]


def ratings_collection() -> Collection:
    return get_db()["ratings"]

# ---------------- Índices (startup) ----------------

def init_indexes() -> None:
    """Crear índices necesarios (idempotente)."""
    # comments: por trip y fecha
    comments_collection().create_index(
        [("tripId", ASCENDING), ("createdAt", ASCENDING)],
        name="comments_trip_created_idx",
    )
    # trips: slug único (ajusta si usáis otro campo)
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

# ---------------- Utils de serialización ----------------

def _to_public(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return doc
    d = dict(doc)
    if "_id" in d and isinstance(d["_id"], ObjectId):
        d["id"] = str(d["_id"])
        del d["_id"]
    return d

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

def upsert_rating(trip_id: str, value: int, user_id: Optional[str]) -> Dict[str, Any]:
    """
    Inserta/actualiza el rating de un usuario para un trip.
    Requiere índice único (tripId, userId).
    """
    col = ratings_collection()
    filter_q = {"tripId": trip_id, "userId": user_id}
    update_q = {"$set": {"value": int(value)}}
    col.update_one(filter_q, update_q, upsert=True)
    doc = col.find_one(filter_q)
    return _to_public(doc or {})


def get_trip_rating_stats(trip_id: str) -> Dict[str, Any]:
    """
    Devuelve {'tripId': str, 'count': int, 'avg': float|None}
    """
    col = ratings_collection()
    pipeline: List[Dict[str, Any]] = [
        {"$match": {"tripId": trip_id}},
        {"$group": {"_id": "$tripId", "count": {"$sum": 1}, "avg": {"$avg": "$value"}}},
    ]
    agg = list(col.aggregate(pipeline))
    if not agg:
        return {"tripId": trip_id, "count": 0, "avg": None}
    row = agg[0]
    return {
        "tripId": str(row.get("_id", trip_id)),
        "count": int(row.get("count", 0) or 0),
        "avg": float(row.get("avg")) if row.get("avg") is not None else None,
    }

# ---------------- Comments ----------------

def add_comment(trip_id: str, text: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Crea un comentario sencillo.
    """
    doc = {
        "tripId": trip_id,
        "text": text,
        "userId": user_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    res = comments_collection().insert_one(doc)
    saved = comments_collection().find_one({"_id": res.inserted_id})
    return _to_public(saved or {})


def list_comments(trip_id: str, limit: int = 20, skip: int = 0) -> List[Dict[str, Any]]:
    """
    Lista comentarios por trip, ordenados por fecha ascendente.
    """
    cursor = (
        comments_collection()
        .find({"tripId": trip_id})
        .sort("createdAt", ASCENDING)
        .skip(int(skip))
        .limit(int(limit))
    )
    return [_to_public(d) for d in cursor]
