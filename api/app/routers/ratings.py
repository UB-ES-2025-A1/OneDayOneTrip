from fastapi import APIRouter, HTTPException
from app.models.rating_model import RatingModel
from app.services.mongo_service import upsert_rating, get_trip_rating_stats

router = APIRouter(prefix="/ratings", tags=["Ratings"])


@router.post("/trip/{trip_id}")
def rate_trip(trip_id: str, rating: RatingModel):
    try:
        upsert_rating(trip_id, rating.userId, rating.rating, rating.date)
        # devolvemos el estado actualizado
        stats = get_trip_rating_stats(trip_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
