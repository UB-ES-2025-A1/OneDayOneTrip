from fastapi import APIRouter
from app.services.firebase_service import db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def get_users():
    users = db.collection("users").get()  # <-- Nombre de tu colección en Firestore
    return [u.to_dict() for u in users]
