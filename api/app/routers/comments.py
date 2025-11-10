from fastapi import APIRouter, HTTPException, Query
from app.models.comment_model import CommentModel
from app.services.mongo_service import add_comment, list_comments

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.post("/")
def create_comment(comment: CommentModel):
    try:
        inserted_id = add_comment(comment.dict())
        return {"message": "Comment creado", "comment_id": inserted_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/trip/{trip_id}")
def get_comments_for_trip(trip_id: str, limit: int = Query(20, ge=1, le=100), skip: int = Query(0, ge=0)):
    return list_comments(trip_id, limit=limit, skip=skip)
