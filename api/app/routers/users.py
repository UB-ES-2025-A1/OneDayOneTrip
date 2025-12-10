from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from app.services.image_service import upload_image_to_imgbb

from google.cloud import firestore

from app.services.firebase_service import db
from app.auth.verify_token import verify_token
from firebase_admin import auth

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.mongo_service import (
    delete_trip,
    create_notification,
)
import json

security = HTTPBearer()

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register")
async def register_user(data: dict, user=Depends(verify_token)):
    """
    Desa un nou usuari al Firestore després de registre al Firebase Auth.
    El frontend envia fullname, username, mail i isPrivate, i el backend completa els defaults.
    """
    uid = user.get("uid")
    if not uid:
        raise HTTPException(status_code=400, detail="Token inválido, falta UID")

    # Defaults amb valors segurs
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
        "llista_solicitud_seguidors": data.get("llista_solicitud_seguidor", []),
        "llista_solicitud_seguits": data.get("llista_solicitud_seguits", []),
        "url_foto_perfil": data.get("url_foto_perfil", ""),
        "url_foto_panell": data.get("url_foto_panell", ""),
        "premium": data.get("premium", False),
        "isPrivate": data.get("isPrivate", False),
        "llista_bloquejats": data.get("llista_bloquejats", []),
        "llista_bloquejadors": data.get("llista_bloquejadors", []),
    }

    print(f"[DEBUG] Creant usuari {uid} amb dades: {user_data}")

    # 🔸 merge=False asegura que tots eks camps s'escriguin, inclos vuits
    db.collection("users").document(uid).set(user_data, merge=False)

    return {"message": "Usuari registrat correctament", "user": user_data}


@router.get("/")
async def get_all_users():
    """
    Retorna tots els usuaris si l'usuari està autenticat.
    """
    docs = db.collection("users").get()
    return [d.to_dict() for d in docs]


@router.get("/search")
async def search_users(
    query: str = "",
    current_user_id: Optional[str] = None,
    blocked_by_me: Optional[str] = None
):
    """
    Cerca usuaris per nom, cognoms o username.
    Exclou els usuaris que m'han bloquejat EXCEPTE si jo també els he bloquejat.
    Inclou tots els altres (privats, bloquejats per mi, etc.)
    """
    docs = db.collection("users").get()
    all_users = [d.to_dict() for d in docs]

    # Parsejar la llista d'usuaris bloquejats per mi
    blocked_by_me_list = []
    if blocked_by_me:
        try:
            blocked_by_me_list = json.loads(blocked_by_me)
        except json.JSONDecodeError:
            blocked_by_me_list = []

    # Filtrar per query si existeix
    search_term = query.lower().strip()
    if search_term:
        all_users = [
            u for u in all_users
            if search_term in (u.get("nom_i_cognoms", "") or "").lower()
            or search_term in (u.get("username", "") or "").lower()
        ]

    # Excloure usuaris que m'han bloquejat i excloure'm a mi mateix
    if current_user_id:
        all_users = [
            u for u in all_users
            if u.get("uid") != current_user_id  # No mostrar-me a mi mateix
            and current_user_id not in (u.get("llista_bloquejats", []) or [])  # No m'han bloquejat
        ]

    return all_users


@router.get("/me")
async def get_current_user(user=Depends(verify_token)):
    """
    Retorna les dades de l'usuari autenticat.
    """
    uid = user.get("uid")
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")
    return doc.to_dict()


@router.get("/{user_id}")
async def get_current_user_by_id(user_id: str):
    """
    Torna les dades de l'usuari pel vostre ID.
    """
    doc = db.collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")
    return doc.to_dict()


# Model amb els camps que poden ser editats del perfil
class UserEditIn(BaseModel):
    nom_i_cognoms: Optional[str] = None
    username: Optional[str] = None
    url_foto_perfil: Optional[str] = None
    url_foto_panell: Optional[str] = None
    isPrivate: Optional[bool] = None


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


@router.post("/cancel_follow_request/{user_id}/{target_id}")
async def cancel_follow_request(user_id: str, target_id: str):
    """
    Cancel·la una sol·licitud de seguiment pendent.
    Elimina user_id de llista_solicitud_seguidors del target_id.
    Elimina target_id de llista_solicitud_seguits del user_id.
    """
    user_ref = db.collection("users").document(user_id)
    target_ref = db.collection("users").document(target_id)

    user_doc = user_ref.get()
    target_doc = target_ref.get()

    # Comprovem que l'usuari existeix
    if not user_doc.exists:
        raise HTTPException(
            status_code=404,
            detail="L'usuari que intenta cancel·lar la sol·licitud no existeix",
        )

    # Comprovem que l'usuari target existeix
    if not target_doc.exists:
        raise HTTPException(status_code=404, detail="L'usuari target no existeix")

    # Eliminar de la llista de sol·licituds enviades
    user_ref.update({"llista_solicitud_seguits": firestore.ArrayRemove([target_id])})

    # Eliminar de la llista de sol·licituds rebudes
    target_ref.update({"llista_solicitud_seguidors": firestore.ArrayRemove([user_id])})

    return {"message": "Sol·licitud de seguiment cancel·lada correctament"}


@router.post("/accept_follow_request/{user_id}/{follower_id}")
async def accept_follow_request(user_id: str, follower_id: str):
    """
    Accepta una sol·licitud de seguiment.
    Afegeix follower_id a la llista de seguidors del user_id.
    Afegeix user_id a la llista de seguits del follower_id.
    Elimina les sol·licituds pendents.
    """
    user_ref = db.collection("users").document(user_id)
    follower_ref = db.collection("users").document(follower_id)

    user_doc = user_ref.get()
    follower_doc = follower_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="L'usuari no existeix")
    if not follower_doc.exists:
        raise HTTPException(status_code=404, detail="L'usuari seguidor no existeix")

    # Reutilitzar la lògica de follow per assegurar consistència
    await follow_user(follower_id, user_id)

    # Eliminar de les llistes de sol·licituds pendents
    user_ref.update(
        {"llista_solicitud_seguidors": firestore.ArrayRemove([follower_id])}
    )
    follower_ref.update({"llista_solicitud_seguits": firestore.ArrayRemove([user_id])})

    # Crear notificació de nou seguidor (mateix format que client.ts)
    try:
        follower_data = follower_doc.to_dict() or {}
        extra = {
            "fromUserName": follower_data.get("nom_i_cognoms")
            or follower_data.get("username")
            or "",
            "fromUserAvatar": follower_data.get("url_foto_perfil", ""),
        }

        create_notification(
            from_user_id=follower_id,
            to_user_id=user_id,
            type="follow",
            message="ha començat a seguir-te",
            extra=extra,
        )
    except Exception as e:
        print(
            f"[WARN] No s'ha pogut crear la notificació de follow en acceptar la sol·licitud: {e}"
        )

    # Crear notificació al sol·licitant informant que se li ha acceptat la sol·licitud
    try:
        user_data = user_doc.to_dict() or {}
        extra_accepted = {
            "fromUserName": user_data.get("nom_i_cognoms")
            or user_data.get("username")
            or "",
            "fromUserAvatar": user_data.get("url_foto_perfil", ""),
        }

        create_notification(
            from_user_id=user_id,
            to_user_id=follower_id,
            type="follow",
            message="ha acceptat la teva sol·licitud de seguiment",
            extra=extra_accepted,
        )
    except Exception as e:
        print(
            f"[WARN] No s'ha pogut crear la notificació d'acceptació al sol·licitant: {e}"
        )

    return {"message": "Sol·licitud de seguiment acceptada correctament"}


@router.post("/reject_follow_request/{user_id}/{follower_id}")
async def reject_follow_request(user_id: str, follower_id: str):
    """
    Rebutja una sol·licitud de seguiment.
    Simplement elimina la sol·licitud pendent sense afegir a seguidors.
    """
    user_ref = db.collection("users").document(user_id)
    follower_ref = db.collection("users").document(follower_id)

    user_doc = user_ref.get()
    follower_doc = follower_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="L'usuari no existeix")
    if not follower_doc.exists:
        raise HTTPException(status_code=404, detail="L'usuari seguidor no existeix")

    # Eliminar de les llistes de sol·licituds pendents
    user_ref.update(
        {"llista_solicitud_seguidors": firestore.ArrayRemove([follower_id])}
    )
    follower_ref.update({"llista_solicitud_seguits": firestore.ArrayRemove([user_id])})

    return {"message": "Sol·licitud de seguiment rebutjada correctament"}


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
    target_doc = target_ref.get()
    if not target_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que vols seguir no existeix"
        )

    user_ref.update({"llista_seguits": firestore.ArrayUnion([target_id])})
    target_ref.update({"llista_seguidors": firestore.ArrayUnion([user_id])})
    return {"message": "Usuari seguit correctament"}


@router.post("/askToFollowUser/{user_id}/{target_id}")
async def ask_to_follow_user(user_id: str, target_id: str):
    """
    Afegeix el target_id a la llista 'llista_solicitud_seguidors' del user_id,
    i afegeix el user_id a la llista 'llista_solicitud_seguits' del target_id.
    """
    if user_id == target_id:
        raise HTTPException(status_code=400, detail="No et pots seguir a tu mateix")

    user_ref = db.collection("users").document(user_id)
    target_ref = db.collection("users").document(target_id)

    # Comprovació que l'usuari a seguir existeix
    target_doc = target_ref.get()
    if not target_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que vols seguir no existeix"
        )

    target_ref.update({"llista_solicitud_seguidors": firestore.ArrayUnion([user_id])})
    user_ref.update({"llista_solicitud_seguits": firestore.ArrayUnion([target_id])})
    return {"message": "Sol·licitud de seguiment enviada correctament"}


@router.post("/save/{user_id}/{trip_id}")
async def save_trip(user_id: str, trip_id: str):
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    user_ref.update({"guardades": firestore.ArrayUnion([trip_id])})
    return {"message": "Ruta guardada correctament"}


@router.post("/unsave/{user_id}/{trip_id}")
async def unsave_trip(user_id: str, trip_id: str):
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    user_ref.update({"guardades": firestore.ArrayRemove([trip_id])})
    return {"message": "Ruta eliminada de guardades correctament"}


@router.post("/block/{user_id}/{target_id}")
async def block_user(user_id: str, target_id: str):
    """
    Afegeix el target_id a la llista 'llista_bloquejats' del user_id,
    i afegeix el user_id a la llista 'llista_bloquejadors' del target_id.
    """
    if user_id == target_id:
        raise HTTPException(status_code=400, detail="No pots bloquejar-te a tu mateix")

    user_ref = db.collection("users").document(user_id)
    target_ref = db.collection("users").document(target_id)

    user_doc = user_ref.get()
    target_doc = target_ref.get()

    # Comprovem que l'usuari bloquejador existeix
    if not user_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que intenta bloquejar no existeix"
        )

    # Comprovem que l'usuari a bloquejar existeix
    if not target_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que vols bloquejar no existeix"
        )

    # Afegir a la llista de bloquejats
    user_ref.update({"llista_bloquejats": firestore.ArrayUnion([target_id])})

    # Afegir a la llista de bloquejadors
    target_ref.update({"llista_bloquejadors": firestore.ArrayUnion([user_id])})

    # Eliminar relacions de seguiment recíproques
    # Si l'usuari (blocker) seguia el target, eliminar aquest seguiment
    user_ref.update({"llista_seguits": firestore.ArrayRemove([target_id])})
    target_ref.update({"llista_seguidors": firestore.ArrayRemove([user_id])})

    # Si el target seguia al blocker, eliminar també aquest seguiment
    user_ref.update({"llista_seguidors": firestore.ArrayRemove([target_id])})
    target_ref.update({"llista_seguits": firestore.ArrayRemove([user_id])})

    return {"message": "Usuari bloquejat correctament"}


@router.post("/unblock/{user_id}/{target_id}")
async def unblock_user(user_id: str, target_id: str):
    """
    Elimina el target_id de la llista 'llista_bloquejats' del user_id,
    i elimina el user_id de la llista 'llista_bloquejadors' del target_id.
    """
    if user_id == target_id:
        raise HTTPException(
            status_code=400, detail="No pots desbloquejar-te a tu mateix"
        )

    user_ref = db.collection("users").document(user_id)
    target_ref = db.collection("users").document(target_id)

    user_doc = user_ref.get()
    target_doc = target_ref.get()

    # Comprovem que l'usuari desbloquejador existeix
    if not user_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que intenta desbloquejar no existeix"
        )

    # Comprovem que l'usuari a desbloquejar existeix
    if not target_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que vols desbloquejar no existeix"
        )

    # Eliminar de la llista de bloquejats
    user_ref.update({"llista_bloquejats": firestore.ArrayRemove([target_id])})

    # Eliminar de la llista de bloquejadors
    target_ref.update({"llista_bloquejadors": firestore.ArrayRemove([user_id])})

    return {"message": "Has desbloquejat l'usuari correctament"}


@router.post("/{user_id}/publicacions/{trip_id}")
async def add_publicacio(user_id: str, trip_id: str, user=Depends(verify_token)):
    """
    Afegeix l'ID d'una ruta a la llista de publicacions de l'usuari.
    Només el propietari pot modificar les vostres publicacions.
    """

    # 🔐 Només l'usuari pot modificar el seu perfil
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

    # 🔹 Afegir una nova publicació (sense duplicats)
    publicacions.add(str(trip_id))

    # 🔹 Guardar actualizació
    doc_ref.update({"publicacions": list(publicacions)})

    return {
        "message": "Publicació afegida correctament",
        "publicacions": list(publicacions),
    }


@router.post("/removefollower/{user_id}/{target_id}")
async def remove_follower(user_id: str, target_id: str):
    """
    Elimina el target_id de la llista de seguidors de user_id.
    A més, elimina user_id de la llista de seguits del target_id
    per mantenir la coherència.
    """

    user_ref = db.collection("users").document(user_id)
    target_ref = db.collection("users").document(target_id)

    user_doc = user_ref.get()
    target_doc = target_ref.get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=404, detail="L'usuari que rep el seguidor no existeix"
        )

    if not target_doc.exists:
        raise HTTPException(
            status_code=404,
            detail="L'usuari que vols eliminar de seguidors no existeix",
        )

    # Eliminar target_id de la llista de seguidors
    user_ref.update({"llista_seguidors": firestore.ArrayRemove([target_id])})

    # Eliminar user_id de la llista de seguits del target
    target_ref.update({"llista_seguits": firestore.ArrayRemove([user_id])})

    return {"message": "Seguidor eliminat correctament"}


@router.delete("/delete/{user_id}")
async def delete_account(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Elimina un compte d'usuari i neteja:
    - el seu document de Firestore
    - el seu usuari de Firebase Auth
    - totes les seves publicacions (trips) a Mongo
    - qualsevol referència a aquestes publicacions a guardades/publicacions d'altres usuaris
    - referències a l'usuari en llistes de seguidors/seguits
    """

    # Verificar token amb Firebase i que l'uid coincideixi amb user_id
    token = credentials.credentials
    try:
        decoded = auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token invàlid o caducat")

    uid = decoded.get("uid")
    if uid != user_id:
        raise HTTPException(
            status_code=403,
            detail="No tens permís per eliminar aquest compte",
        )

    # Obtenir dades de l'usuari a Firestore
    user_ref = db.collection("users").document(user_id)
    doc = user_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    data = doc.to_dict() or {}
    publicacions: List[str] = list(map(str, data.get("publicacions", [])))

    batch = db.batch()

    # Treure user_id de llistes de seguits/seguidors d'altres usuaris
    seguits_q = (
        db.collection("users")
        .where("llista_seguits", "array_contains", user_id)
        .stream()
    )
    for d in seguits_q:
        batch.update(
            d.reference,
            {"llista_seguits": firestore.ArrayRemove([user_id])},
        )

    seguidors_q = (
        db.collection("users")
        .where("llista_seguidors", "array_contains", user_id)
        .stream()
    )
    for d in seguidors_q:
        batch.update(
            d.reference,
            {"llista_seguidors": firestore.ArrayRemove([user_id])},
        )

    # Per a cada publicació seva:
    #    - treure la trip de guardades/publicacions d'altres usuaris
    #    - eliminar la trip de MongoDB
    for trip_id in publicacions:
        # Treure de guardades
        guardades_q = (
            db.collection("users")
            .where("guardades", "array_contains", trip_id)
            .stream()
        )
        for u in guardades_q:
            batch.update(
                u.reference,
                {"guardades": firestore.ArrayRemove([trip_id])},
            )

        # Treure de publicacions d'altres usuaris
        publicacions_q = (
            db.collection("users")
            .where("publicacions", "array_contains", trip_id)
            .stream()
        )
        for u in publicacions_q:
            batch.update(
                u.reference,
                {"publicacions": firestore.ArrayRemove([trip_id])},
            )

        # Eliminar trip a Mongo amb la mateixa funció que uses al endpoint /trips/{trip_id}
        try:
            deleted = delete_trip(str(trip_id))
            if deleted == 0:
                print(f"[WARN] Trip {trip_id} no trobada o no eliminada a Mongo.")
        except Exception as e:
            print(f"[ERROR] No s'ha pogut eliminar la trip {trip_id} de Mongo:", e)

    # Aplicar totes les actualitzacions a Firestore
    batch.commit()

    # Eliminar document d'usuari
    user_ref.delete()

    # Eliminar usuari de Firebase Auth
    try:
        auth.delete_user(uid)
    except Exception as e:
        print(f"[ERROR] No s'ha pogut eliminar l'usuari de Firebase Auth: {e}")

    return {"message": "Compte i dades relacionades eliminats correctament"}


@router.delete("/{user_id}/publicacions/{trip_id}")
async def remove_publicacio_llista_publicacions(user_id: str, trip_id: str):
    doc_ref = db.collection("users").document(user_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    doc_ref.update({"publicacions": firestore.ArrayRemove([trip_id])})

    return {"message": "Publicació eliminada", "trip_id": trip_id}


@router.delete("/{user_id}/guardats/{trip_id}")
async def remove_guardat(user_id: str, trip_id: str):
    doc_ref = db.collection("users").document(user_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        raise HTTPException(status_code=404, detail="Usuari no trobat")

    doc_ref.update({"guardades": firestore.ArrayRemove([trip_id])})

    return {"message": "Ruta eliminada de guardats", "trip_id": trip_id}
