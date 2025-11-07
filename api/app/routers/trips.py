from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.services.mongo_service import trips_collection

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("/")
def get_all_trips():
    trips = list(trips_collection.find({}))
    for t in trips:
        t["_id"] = str(t["_id"])
    return trips

@router.post("/")
def create_trip(trip: dict):
    result = trips_collection.insert_one(trip)
    return {"inserted_id": str(result.inserted_id)}

@router.get("/{trip_id}")
def get_trip(trip_id: str):
    trip = trips_collection.find_one({"_id": ObjectId(trip_id)})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip["_id"] = str(trip["_id"])
    return trip

#Otro comentario de para la estructuración de las branches