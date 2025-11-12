from pymongo import MongoClient, ASCENDING
from bson import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["OneDayOneTrip"]

trips_collection = db["trips"]
comments_collection = db["comments"]
ratings_collection = db["ratings"]

# Índices recomendados
comments_collection.create_index([("tripId", ASCENDING), ("createdAt", ASCENDING)])
ratings_collection.create_index([("tripId", ASCENDING)])
ratings_collection.create_index(
    [("tripId", ASCENDING), ("userId", ASCENDING)], unique=True
)

# ──────────────────────────────────────────────────────────────────────────────
# 🗺️  TRIPS
# ──────────────────────────────────────────────────────────────────────────────

def save_trip(trip: dict) -> str:
    """Guarda una nueva trip en Mongo y devuelve su ID."""
    res = trips_collection.insert_one(trip)
    return str(res.inserted_id)


def get_all_trips():
    """Devuelve todas las trips (ya contienen location_name calculado al crearse)."""
    trips = list(trips_collection.find({}))
    for t in trips:
        t["_id"] = str(t["_id"])
    return trips


def get_trip_by_id(trip_id: str):
    """Devuelve una trip específica por ID."""
    trip = trips_collection.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        return None
    trip["_id"] = str(trip["_id"])
    return trip


# ──────────────────────────────────────────────────────────────────────────────
# ⭐ RATINGS
# ──────────────────────────────────────────────────────────────────────────────

def get_trip_rating_stats(trip_id: str):
    """Calcula el promedio y el conteo de ratings de una trip."""
    pipeline = [
        {"$match": {"tripId": ObjectId(trip_id)}},
        {"$group": {"_id": "$tripId", "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    agg = list(ratings_collection.aggregate(pipeline))
    if not agg:
        return {"avgRating": 0.0, "numRatings": 0}
    return {"avgRating": round(agg[0]["avg"], 2), "numRatings": agg[0]["count"]}


def upsert_rating(trip_id: str, user_id: str, rating: int, date):
    """Crea o actualiza el rating de un usuario para una trip."""
    ratings_collection.update_one(
        {"tripId": ObjectId(trip_id), "userId": user_id},
        {"$set": {"rating": rating, "date": date}},
        upsert=True,
    )


# ──────────────────────────────────────────────────────────────────────────────
# 💬 COMMENTS
# ──────────────────────────────────────────────────────────────────────────────

def add_comment(doc: dict) -> str:
    """Añade un nuevo comentario vinculado a una trip."""
    doc_db = {**doc, "tripId": ObjectId(doc["tripId"])}
    res = comments_collection.insert_one(doc_db)
    return str(res.inserted_id)


def list_comments(trip_id: str, limit: int = 20, skip: int = 0):
    """Obtiene comentarios paginados de una trip."""
    cursor = (
        comments_collection.find({"tripId": ObjectId(trip_id)})
        .sort("createdAt", ASCENDING)
        .skip(skip)
        .limit(limit)
    )
    out = []
    for c in cursor:
        c["_id"] = str(c["_id"])
        c["tripId"] = str(c["tripId"])
        out.append(c)
    return out