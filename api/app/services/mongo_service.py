# api/app/services/mongo_service.py
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

# ============================================================
# 🧩 Conexión segura a MongoDB (con fallback a mock en CI/test)
# ============================================================

try:
    if not MONGO_URI:
        raise ValueError("MONGO_URI no definido")

    client = MongoClient(MONGO_URI)
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

    print("[INFO] ✅ Conectado correctamente a MongoDB.")

except Exception as e:
    print(f"[WARN] ⚠️ No se pudo conectar a MongoDB: {e}")
    print("[INFO] 🧪 Usando mock de MongoDB (modo test/CI).")

    class MockCollection:
        """Simula una colección de MongoDB para entornos de test."""
        def insert_one(self, doc):
            print(f"[MOCK] insert_one({doc})")
            return type("MockRes", (), {"inserted_id": "mock_id"})()

        def find(self, *args, **kwargs):
            print("[MOCK] find() llamado.")
            return []

        def find_one(self, *args, **kwargs):
            print("[MOCK] find_one() llamado.")
            return None

        def aggregate(self, *args, **kwargs):
            print("[MOCK] aggregate() llamado.")
            return []

        def update_one(self, *args, **kwargs):
            print("[MOCK] update_one() llamado.")
            return None

        def create_index(self, *args, **kwargs):
            print("[MOCK] create_index() llamado.")
            return None

        def sort(self, *args, **kwargs): return self
        def skip(self, *args, **kwargs): return self
        def limit(self, *args, **kwargs): return []

    class MockDB:
        def __getitem__(self, name):
            print(f"[MOCK] db['{name}'] accedido.")
            return MockCollection()

    db = MockDB()
    trips_collection = db["trips"]
    comments_collection = db["comments"]
    ratings_collection = db["ratings"]

# ============================================================
# 🗺️  TRIPS
# ============================================================

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
    try:
        trip = trips_collection.find_one({"_id": ObjectId(trip_id)})
    except Exception:
        return None
    if not trip:
        return None
    trip["_id"] = str(trip["_id"])
    return trip


# ============================================================
# ⭐ RATINGS
# ============================================================

def get_trip_rating_stats(trip_id: str):
    """Calcula el promedio y el conteo de ratings de una trip."""
    try:
        pipeline = [
            {"$match": {"tripId": ObjectId(trip_id)}},
            {"$group": {"_id": "$tripId", "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
        ]
        agg = list(ratings_collection.aggregate(pipeline))
    except Exception:
        return {"avgRating": 0.0, "numRatings": 0}

    if not agg:
        return {"avgRating": 0.0, "numRatings": 0}
    return {"avgRating": round(agg[0]["avg"], 2), "numRatings": agg[0]["count"]}


def upsert_rating(trip_id: str, user_id: str, rating: int, date):
    """Crea o actualiza el rating de un usuario para una trip."""
    try:
        ratings_collection.update_one(
            {"tripId": ObjectId(trip_id), "userId": user_id},
            {"$set": {"rating": rating, "date": date}},
            upsert=True,
        )
    except Exception as e:
        print(f"[MOCK] update_one() falló o fue mockeado: {e}")
        return None


# ============================================================
# 💬 COMMENTS
# ============================================================

def list_comments(trip_id: str, limit: int = 20, skip: int = 0):
    """Obtiene comentarios ordenados (más nuevos primero)."""
    try:
        cursor = (
            comments_collection.find({"tripId": ObjectId(trip_id)})
            .sort("createdAt", DESCENDING)
            .skip(skip)
            .limit(limit)
        )

        out = []
        for c in cursor:
            c["_id"] = str(c["_id"])
            c["tripId"] = str(c["tripId"])

            # Convert datetime → string ISO para frontend
            if isinstance(c["createdAt"], datetime):
                c["createdAt"] = c["createdAt"].isoformat()

            out.append(c)

        return out

    except Exception:
        print("[MOCK] list_comments() ejecutado sin Mongo real.")
        return []
