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
# Evita duplicar rating del mismo usuario en la misma trip
ratings_collection.create_index([("tripId", ASCENDING), ("userId", ASCENDING)], unique=True)

def save_trip(trip: dict) -> str:
    res = trips_collection.insert_one(trip)
    return str(res.inserted_id)

def get_all_trips():
    trips = list(trips_collection.find({}))
    for t in trips:
        t["_id"] = str(t["_id"])
    return trips

def get_trip_by_id(trip_id: str):
    trip = trips_collection.find_one({"_id": ObjectId(trip_id)})
    if trip:
        trip["_id"] = str(trip["_id"])
    return trip

def get_trip_rating_stats(trip_id: str):
    """Devuelve promedio y conteo calculado en Mongo (rápido y exacto)."""
    pipeline = [
        {"$match": {"tripId": ObjectId(trip_id)}},
        {"$group": {"_id": "$tripId", "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    agg = list(ratings_collection.aggregate(pipeline))
    if not agg:
        return {"avgRating": 0.0, "numRatings": 0}
    return {"avgRating": round(agg[0]["avg"], 2), "numRatings": agg[0]["count"]}

def add_comment(doc: dict) -> str:
    # tripId guardado como ObjectId en DB
    doc_db = {**doc, "tripId": ObjectId(doc["tripId"])}
    res = comments_collection.insert_one(doc_db)
    return str(res.inserted_id)

def list_comments(trip_id: str, limit: int = 20, skip: int = 0):
    cursor = comments_collection.find({"tripId": ObjectId(trip_id)}) \
                                .sort("createdAt", ASCENDING) \
                                .skip(skip).limit(limit)
    out = []
    for c in cursor:
        c["_id"] = str(c["_id"])
        c["tripId"] = str(c["tripId"])
        out.append(c)
    return out

def upsert_rating(trip_id: str, user_id: str, rating: int, date):
    ratings_collection.update_one(
        {"tripId": ObjectId(trip_id), "userId": user_id},
        {"$set": {"rating": rating, "date": date}},
        upsert=True
    )
