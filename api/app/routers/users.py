from fastapi import APIRouter, Depends, Request, HTTPException
from app.services.firebase_service import db
from app.auth.verify_token import verify_token
from datetime import datetime


router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
async def register_user(data: dict, user=Depends(verify_token)):
    """
    Guarda un nuevo usuario en Firestore tras registro en Firebase Auth.
    El frontend envía fullname, username, mail.
    """
    uid = user.get("uid")

    if not uid:
        raise HTTPException(status_code=400, detail="Token inválido, falta UID")

    user_data = {
        "uid": uid,
        "data_creacio": datetime.utcnow().isoformat(),
        "nom_i_cognoms": data.get("fullname"),
        "mail": data.get("mail"),
        "role": "user",
        "username": data.get("username"),
        "seguidors": 0,
        "seguits": 0,
        "publicacions": [],
        "guardades": [],
        "url_foto_perfil": "",
        "url_foto_panell": "",
        "premium": False,
    }


    db.collection("users").document(uid).set(user_data)
    return {"message": "Usuario registrado correctamente", "user": user_data}


@router.get("/")
async def get_all_users():
    """
    Devuelve todos los usuarios si el usuario está autenticado.
    """
    docs = db.collection("users").get()
    return [d.to_dict() for d in docs]


@router.get("/me")
async def get_current_user(user=Depends(verify_token)):
    """
    Devuelve los datos del usuario autenticado.
    """
    uid = user.get("uid")
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return doc.to_dict()

@router.get("/{user_id}")
async def get_current_user_by_id(user_id: str):
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return doc.to_dict()
