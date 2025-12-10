# api/app/services/mongo_service.py
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

# ============================================================
# 🧩 Conexió segura a MongoDB (amb fallback a mock en CI/test)
# ============================================================

try:
    if not MONGO_URI:
        raise ValueError("MONGO_URI no definit")

    client = MongoClient(MONGO_URI)
    db = client["OneDayOneTrip"]

    trips_collection = db["trips"]
    comments_collection = db["comments"]
    ratings_collection = db["ratings"]
    notifications_collection = db["notification"]

    # Índex recomanats
    comments_collection.create_index([("tripId", ASCENDING), ("createdAt", ASCENDING)])

    ratings_collection.create_index([("tripId", ASCENDING)])
    ratings_collection.create_index(
        [("tripId", ASCENDING), ("userId", ASCENDING)], unique=True
    )
    notifications_collection.create_index(
        [("userId", ASCENDING), ("createdAt", DESCENDING)]
    )

    print("[INFO] ✅ Connectat correctament a MongoDB.")

except Exception as e:
    print(f"[WARN] ⚠️ No s'ha pogut connectar a MongoDB: {e}")
    print("[INFO] 🧪 Utilitzant mock de MongoDB (mode test/CI).")

    class MockCollection:
        """Simula una colecció de MongoDB para entorns de test."""

        def insert_one(self, doc):
            print(f"[MOCK] insert_one({doc})")
            return type("MockRes", (), {"inserted_id": "mock_id"})()

        def find(self, *args, **kwargs):
            print("[MOCK] find() cridat.")
            return []

        def find_one(self, *args, **kwargs):
            print("[MOCK] find_one() cridat.")
            return None

        def aggregate(self, *args, **kwargs):
            print("[MOCK] aggregate() cridat.")
            return []

        def update_one(self, *args, **kwargs):
            print("[MOCK] update_one() cridat.")
            return None

        def create_index(self, *args, **kwargs):
            print("[MOCK] create_index() cridat.")
            return None

        def sort(self, *args, **kwargs):
            return self

        def skip(self, *args, **kwargs):
            return self

        def limit(self, *args, **kwargs):
            return []

    class MockDB:
        def __getitem__(self, name):
            print(f"[MOCK] db['{name}'] accedit.")
            return MockCollection()

    db = MockDB()
    trips_collection = db["trips"]
    comments_collection = db["comments"]
    ratings_collection = db["ratings"]

# ============================================================
# 🗺️  TRIPS
# ============================================================


def save_trip(trip: dict) -> str:
    """Guarda una nova trip a Mongo i retorna el seu ID."""
    res = trips_collection.insert_one(trip)
    return str(res.inserted_id)


def get_all_trips():
    """Retorna totes les trips (ja contenen location_name calculat al crear-se)."""
    trips = list(trips_collection.find({}))
    for t in trips:
        t["_id"] = str(t["_id"])
    return trips


def get_trip_by_id(trip_id: str):
    """Retorna una trip específica pel seu ID."""
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
    """Calcula el promig i el conteig de ratings d'una trip."""
    try:
        pipeline = [
            {"$match": {"tripId": ObjectId(trip_id)}},
            {
                "$group": {
                    "_id": "$tripId",
                    "avg": {"$avg": "$rating"},
                    "count": {"$sum": 1},
                }
            },
        ]
        agg = list(ratings_collection.aggregate(pipeline))
    except Exception:
        return {"avgRating": 0.0, "numRatings": 0}

    if not agg:
        return {"avgRating": 0.0, "numRatings": 0}
    return {"avgRating": round(agg[0]["avg"], 2), "numRatings": agg[0]["count"]}


def upsert_rating(trip_id: str, user_id: str, rating: int, date):
    """Crear o actualitza el rating d'un usuari per a una trip."""
    try:
        ratings_collection.update_one(
            {"tripId": ObjectId(trip_id), "userId": user_id},
            {"$set": {"rating": rating, "date": date}},
            upsert=True,
        )
    except Exception as e:
        print(f"[MOCK] update_one() ha fallat o ha sigut mockejada: {e}")
        return None


# ============================================================
# 💬 COMMENTS
# ============================================================


def list_comments(trip_id: str, limit: int = 20, skip: int = 0):
    """Obté comentaris ordenats (més nous primer)."""
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
        print("[MOCK] list_comments() executat sense Mongo real.")
        return []


def delete_trip(trip_id: str) -> int:
    """Elimina una trip de MongoDB per ID i retorna quantes s'han eliminat (0 o 1)."""
    try:
        res = trips_collection.delete_one({"_id": ObjectId(trip_id)})
        return res.deleted_count
    except Exception as e:
        print(f"[ERROR] No s'ha pogut eliminar la trip {trip_id}: {e}")
        return 0


# ============================================================
# 🔔 NOTIFICATIONS
# ============================================================


def create_notification(
    from_user_id: str, to_user_id: str, type: str, message: str, extra: dict = None
):
    """
    Crea una notificación completa y clara:
      - fromUserId: quien genera la acción
      - toUserId: destinatario
      - type: follow_request | follow | comment | rating | ...
      - message: texto principal
      - extra: datos adicionales que necesita el frontend (nombre, avatar, etc.)
    """
    notif = {
        "fromUserId": from_user_id,
        "toUserId": to_user_id,
        "type": type,
        "message": message,
        "extra": extra or {},
        "read": False,
        "createdAt": datetime.utcnow(),
    }

    res = notifications_collection.insert_one(notif)
    return str(res.inserted_id)


def list_notifications(user_id: str, only_unread: bool = False):
    """
    Devuelve notificaciones EXACTAMENTE en el formato esperado por MailBox.
    """
    query = {"toUserId": user_id}
    if only_unread:
        query["read"] = False

    raw = notifications_collection.find(query).sort("createdAt", DESCENDING)

    formatted = []
    for n in raw:
        extra = n.get("extra", {})
        formatted.append(
            {
                "id": str(n["_id"]),
                "type": n["type"],
                "fromUserId": n.get("fromUserId"),
                "toUserId": n.get("toUserId"),
                "fromUserName": extra.get("fromUserName", "Algú"),
                "fromUserAvatar": extra.get("fromUserAvatar"),
                "tripTitle": extra.get("tripTitle"),
                "text": n["message"],
                "createdAt": n["createdAt"].isoformat(),
                "read": n["read"],
            }
        )

    return formatted


def mark_notification_as_read(notification_id: str):
    try:
        res = notifications_collection.update_one(
            {"_id": ObjectId(notification_id)}, {"$set": {"read": True}}
        )
        return res.modified_count == 1
    except Exception:
        return False


def delete_notification(notification_id: str):
    """Elimina una notificació per ID"""
    try:
        res = notifications_collection.delete_one(
            {"_id": ObjectId(notification_id)}
        )
        return res.deleted_count == 1
    except Exception:
        return False
