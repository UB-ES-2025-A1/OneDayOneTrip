from fastapi import APIRouter, HTTPException, Query, Request
from bson import ObjectId
from datetime import datetime

from app.models.comment_model import CommentModel
from app.services.mongo_service import comments_collection, list_comments

router = APIRouter(prefix="/trips", tags=["Comments"])


# ============================================================
# 🟢 Crear comentario (con prints de debugging)
# ============================================================
@router.post("/{trip_id}/comments")
async def create_comment(trip_id: str, comment: CommentModel, request: Request):
    try:
        print("\n==============================")
        print("📩 Nuevo request: POST /trips/{trip_id}/comments")
        print(f"➡️ trip_id recibido en path: {trip_id}")

        # Body en crudo
        raw_body = await request.body()
        print(f"📦 RAW BODY: {raw_body.decode('utf-8')}")

        # Modelo recibido
        print(f"📝 Comentario recibido (Pydantic): {comment}")
        print("------------------------------")

        # Normalizar fecha
        created_at = comment.createdAt or datetime.utcnow().isoformat()
        print(f"⏱ createdAt final: {created_at}")

        # Convertir tripId a ObjectId
        try:
            trip_obj_id = ObjectId(comment.tripId)
            print(f"🆗 tripId convertido correctamente a ObjectId: {trip_obj_id}")
        except Exception as e:
            print("❌ Error convirtiendo tripId a ObjectId:", e)
            raise HTTPException(status_code=400, detail="tripId inválido")

        # Normalizar fecha
        created_at = comment.createdAt or datetime.utcnow()   # ⬅️ NO STRING
        print(f"⏱ createdAt final (datetime): {created_at}")

        new_comment = {
            "tripId": trip_obj_id,
            "userId": comment.userId,
            "userProfilePicture": comment.userProfilePicture,
            "userName": comment.userName,
            "text": comment.text,
            "createdAt": created_at,   # ⬅️ datetime real
        }


        print(f"📤 Documento a insertar en Mongo: {new_comment}")

        result = comments_collection.insert_one(new_comment)

        print("🆕 Insertado en Mongo con _id:", result.inserted_id)

        # Preparar respuesta
        new_comment["_id"] = str(result.inserted_id)
        new_comment["tripId"] = str(new_comment["tripId"])

        print(f"📨 Respuesta final enviada al frontend: {new_comment}")
        print("==============================\n")

        return {
            "message": "Comentari creat correctament",
            "comment": new_comment
        }

    except Exception as e:
        print("💥 ERROR interno en create_comment:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 🟣 Obtener comentarios (con prints de debugging)
# ============================================================
@router.get("/{trip_id}/comments")
def get_comments_for_trip(
    trip_id: str,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    try:
        print("\n==============================")
        print("📩 Nuevo request: GET /trips/{trip_id}/comments")
        print(f"➡️ trip_id recibido: {trip_id}")
        print(f"📊 limit={limit}, skip={skip}")

        comments = list_comments(trip_id, limit=limit, skip=skip)

        print(f"📤 Comentarios devueltos ({len(comments)}):")
        for c in comments:
            print(" -", c)

        print("==============================\n")

        return {"comments": comments}

    except Exception as e:
        print("💥 ERROR interno en get_comments_for_trip:", e)
        raise HTTPException(status_code=500, detail=str(e))
