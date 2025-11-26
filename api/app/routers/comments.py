# api/app/routes/comments.py

from fastapi import APIRouter, HTTPException, Query, Request
from bson import ObjectId
from datetime import datetime

from app.models.comment_model import CommentModel
from app.services.mongo_service import comments_collection, list_comments

router = APIRouter(prefix="/trips", tags=["Comments"])


# ============================================================
# 🟢 Crear comentario
# ============================================================
@router.post("/{trip_id}/comments")
async def create_comment(trip_id: str, comment: CommentModel, request: Request):
    try:
        print("\n==============================")
        print("📩 POST comentario a trip:", trip_id)

        created_at = comment.createdAt or datetime.utcnow()

        try:
            trip_obj_id = ObjectId(comment.tripId)
        except Exception:
            raise HTTPException(status_code=400, detail="tripId inválido")

        new_comment = {
            "tripId": trip_obj_id,
            "userId": comment.userId,
            "userProfilePicture": comment.userProfilePicture,
            "userName": comment.userName,
            "text": comment.text,
            "createdAt": created_at,
        }

        result = comments_collection.insert_one(new_comment)

        new_comment["_id"] = str(result.inserted_id)
        new_comment["tripId"] = str(trip_obj_id)
        new_comment["createdAt"] = created_at.isoformat()

        print("📨 Respuesta:", new_comment)
        print("==============================\n")

        return {"comment": new_comment}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 🟣 Obtener comentarios
# ============================================================
@router.get("/{trip_id}/comments")
def get_comments_for_trip(
    trip_id: str, limit: int = Query(20, ge=1, le=100), skip: int = Query(0, ge=0)
):
    try:
        comments = list_comments(trip_id, limit, skip)
        return {"comments": comments}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
