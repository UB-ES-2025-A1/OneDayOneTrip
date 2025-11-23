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


@router.post("/{user_id}/publicacions/{trip_id}")
async def add_publicacio(user_id: str, trip_id: str, user=Depends(verify_token)):
    """
    Añade el ID de una ruta a la lista de publicaciones del usuario.
    Solo el propietario puede modificar sus publicaciones.
    """

    # 🔐 Solo el propio usuario puede modificar su perfil
    if user.get("uid") != user_id:
      raise HTTPException(status_code=403, detail="No tens permís per modificar aquest usuari.")

    doc_ref = db.collection("users").document(user_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    data = snapshot.to_dict()
    publicacions = set(data.get("publicacions", []))

    # 🔹 Añadir la nueva publicación (sin duplicados)
    publicacions.add(str(trip_id))

    # 🔹 Guardar actualización
    doc_ref.update({"publicacions": list(publicacions)})

    return {
        "message": "Publicació afegida correctament",
        "publicacions": list(publicacions)
    }
