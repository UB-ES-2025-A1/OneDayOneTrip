from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.services.firebase_service import db
from app.auth.verify_token import verify_token

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register")
async def register_user(data: dict, user=Depends(verify_token)):
    """
    Guarda un nuevo usuario en Firestore tras registro en Firebase Auth.
    El frontend envía fullname, username, mail, y el backend completa los defaults.
    """
    uid = user.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="Token inválido, falta UID")

    # 🔹 Defaults con valores seguros
    user_data = {
        "uid": uid,
        "data_creacio": datetime.utcnow().isoformat(),
        "nom_i_cognoms": data.get("fullname") or "",
        "mail": data.get("mail") or "",
        "role": "user",
        "username": data.get("username") or "",
        "seguidors": data.get("seguidors", 0),
        "seguits": data.get("seguits", 0),
        "publicacions": data.get("publicacions", []),
        "guardades": data.get("guardades", []),
        "url_foto_perfil": data.get("url_foto_perfil", ""),
        "url_foto_panell": data.get("url_foto_panell", ""),
        "premium": data.get("premium", False),
        "llista_seguidors": data.get("lista_seguidores", []),
        "llista_seguits": data.get("lista_seguidos", []),
    }

    print(f"[DEBUG] Creando usuario {uid} con datos: {user_data}")

    # 🔸 merge=False asegura que todos los campos se escriban, incluso vacíos
    db.collection("users").document(uid).set(user_data, merge=False)

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
    """
    Devuelve los datos del usuario por su ID.
    """
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return doc.to_dict()
