from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.services.mongo_service import ratings_collection, trips_collection
from app.models.rating_model import RatingModel

router = APIRouter(prefix="/ratings", tags=["Ratings"])

@router.post("/trip/{trip_id}")
def rate_trip(trip_id: str, rating: RatingModel):
    # Evitar valoraciones duplicadas del mismo usuario
    existing = ratings_collection.find_one({
        "tripId": ObjectId(trip_id),
        "userId": rating.userId
    })
    if existing:
        ratings_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"rating": rating.rating, "date": rating.date}}
        )
    else:
        ratings_collection.insert_one({
            **rating.dict(),
            "tripId": ObjectId(trip_id)
        })

    # Recalcular promedio
    all_ratings = list(ratings_collection.find({"tripId": ObjectId(trip_id)}))
    avg = sum(r["rating"] for r in all_ratings) / len(all_ratings)
    trips_collection.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {"avgRating": round(avg, 2), "numRatings": len(all_ratings)}}
    )

    return {"avgRating": round(avg, 2), "numRatings": len(all_ratings)}
