from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.services.image_service import upload_image_to_imgbb

from google.cloud import firestore

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

    # Defaults con valores seguros
    user_data = {
        "uid": uid,
        "data_creacio": datetime.utcnow().isoformat(),
        "nom_i_cognoms": data.get("fullname") or "",
        "mail": data.get("mail") or "",
        "role": "user",
        "username": data.get("username") or "",
        "publicacions": data.get("publicacions", []),
        "guardades": data.get("guardades", []),
        "llista_seguidors": data.get("lista_seguidores", []),
        "llista_seguits": data.get("lista_seguidos", []),
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


# Model amb  els camps que poden ser editats del perfil
class UserEditIn(BaseModel):
    nom_i_cognoms: Optional[str] = None
    username: Optional[str] = None
    url_foto_perfil: Optional[str] = None
    url_foto_panell: Optional[str] = None


# (PATCH = modificació parcial)
@router.patch("/update/{user_id}")
async def update_user_multipart(
    user_id: str,
    user_json: str = Form(...),
    foto_perfil: Optional[UploadFile] = File(None),
    foto_panell: Optional[UploadFile] = File(None),
):
    # Validació del JSON enviat com a text
    try:
        data = UserEditIn.model_validate_json(user_json)
    except Exception:
        raise HTTPException(status_code=400, detail="JSON invàlid")

    ref = db.collection("users").document(user_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="L'usuari no existeix")

    # Pujar nova foto de perfil si existeix
    perfil_url = None
    if foto_perfil:
        perfil_url = upload_image_to_imgbb(foto_perfil)

    # Pujar nova foto de panell si existeix
    panell_url = None
    if foto_panell:
        panell_url = upload_image_to_imgbb(foto_panell)

    # Construir dades a actualitzar
    update_data = {k: v for k, v in data.dict().items() if v is not None}

    if perfil_url:
        update_data["url_foto_perfil"] = perfil_url

    if panell_url:
        update_data["url_foto_panell"] = panell_url

    if not update_data:
        raise HTTPException(
            status_code=400, detail="No s'ha enviat cap dada per actualitzar"
        )

    ref.update(update_data)

    return {"message": "Perfil actualitzat correctament", "updated": update_data}


@router.post("/unfollow/{user_id}/{target_id}")
async def unfollow_user(user_id: str, target_id: str):
    user_ref = db.collection("users").document(user_id)
    target_ref = db.collection("users").document(target_id)

    user_doc = user_ref.get()
    target_doc = target_ref.get()

    # Comprovem que l'usuari existeix
    if not user_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que intenta deixar de seguir no existeix"
        )

    # Comprovem que l'usuari a deixar de seguir existeix
    if not target_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que vols deixar de seguir no existeix"
        )

    # Eliminar de la llista de seguits
    user_ref.update({"llista_seguits": firestore.ArrayRemove([target_id])})

    # Eliminar de la llista de seguidors
    target_ref.update({"llista_seguidors": firestore.ArrayRemove([user_id])})

    return {"message": "Has deixat de seguir l'usuari correctament"}


@router.post("/follow/{user_id}/{target_id}")
async def follow_user(user_id: str, target_id: str):
    """
    Afegeix el target_id a la llista 'llista_seguits' del user_id,
    i afegeix el user_id a la llista 'llista_seguidors' del target_id.
    """
    if user_id == target_id:
        raise HTTPException(status_code=400, detail="No et pots seguir a tu mateix")

    user_ref = db.collection("users").document(user_id)
    target_ref = db.collection("users").document(target_id)

    # Comprovació que l'usuari a seguir existeix
    if not target_ref.get().exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que vols seguir no existeix"
        )

    # Afegir a la llista de seguits
    user_ref.update({"llista_seguits": firestore.ArrayUnion([target_id])})

    # Afegir a la llista de seguidors
    target_ref.update({"llista_seguidors": firestore.ArrayUnion([user_id])})

    return {"message": "Usuari seguit correctament"}


@router.post("/save/{user_id}/{trip_id}")
async def save_trip(user_id: str, trip_id: str):
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    user_ref.update({
        "guardades": firestore.ArrayUnion([trip_id])
    })
    return {"message": "Ruta guardada correctament"}


@router.post("/unsave/{user_id}/{trip_id}")
async def unsave_trip(user_id: str, trip_id: str):
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    user_ref.update({
        "guardades": firestore.ArrayRemove([trip_id])
    })
    return {"message": "Ruta eliminada de guardades correctament"}


@router.post("/{user_id}/publicacions/{trip_id}")
async def add_publicacio(user_id: str, trip_id: str, user=Depends(verify_token)):
    """
    Añade el ID de una ruta a la lista de publicaciones del usuario.
    Solo el propietario puede modificar sus publicaciones.
    """

    # 🔐 Solo el propio usuario puede modificar su perfil
    if user.get("uid") != user_id:
        raise HTTPException(
            status_code=403, detail="No tens permís per modificar aquest usuari."
        )

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
        "publicacions": list(publicacions),
    }
