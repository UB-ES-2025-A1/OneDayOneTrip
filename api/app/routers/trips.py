from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from typing import List, Optional
from app.models.trip_model import TripModel
from app.models.trip_create_in import TripCreateIn
from app.services.image_service import upload_image_to_imgbb
from app.services.mongo_service import (
    save_trip,
    get_all_trips,
    get_trip_by_id,
    get_trip_rating_stats,
)
import requests
import time
import json

from datetime import datetime
from app.services.mongo_service import upsert_rating
from fastapi import Body

router = APIRouter(prefix="/trips", tags=["Trips"])


# ============================================================
# 🌍 Geocodificació amb Debug
# ============================================================
def get_location_name(lat: float, lon: float) -> str:
    """Converteix coordenades (lat, lon) en nom d'ubicació llegible (amb debug)."""
    print(f"\n[DEBUG] 🌍 get_location_name() cridada amb lat={lat}, lon={lon}")
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {"format": "jsonv2", "lat": lat, "lon": lon, "accept-language": "es"}
        headers = {
            "User-Agent": "OneDayOneTrip/1.0 (https://onedayonecity.web.app; contacto: admin@onedayonetrip.com)"
        }

        print(f"[DEBUG] 🔗 Fent petició GET a {url} con params={params}")
        resp = requests.get(url, params=params, headers=headers, timeout=8)
        print(f"[DEBUG] ✅ Resposta HTTP: {resp.status_code}")

        resp.raise_for_status()
        data = resp.json()
        print(
            f"[DEBUG] 📦 JSON rebut: {json.dumps(data, indent=2, ensure_ascii=False)[:400]}..."
        )

        name = (
            data.get("display_name")
            or data.get("name")
            or ", ".join(data.get("address", {}).values())
        )
        print(f"[DEBUG] 📍 Nom detectat: {name}")
        return name if name else "Ubicació desconeguda"

    except Exception as e:
        print(f"[ERROR] ⚠️ Error geocoding ({lat},{lon}): {e}")
        return "Ubicació desconeguda"


# ============================================================
# 📋 Endpoints
# ============================================================


@router.get("/")
def list_trips(include_stats: bool = False):
    print(f"\n[DEBUG] 📄 list_trips() cridada amb include_stats={include_stats}")
    trips = get_all_trips()
    print(f"[DEBUG] 📊 Número de trips recuperades: {len(trips)}")

    if include_stats:
        for t in trips:
            print(f"[DEBUG] Calculant estadístiques per trip_id={t['_id']}")
            stats = get_trip_rating_stats(t["_id"])
            t.update(stats)
    return trips


@router.get("/{trip_id}")
def get_trip(trip_id: str):
    print(f"\n[DEBUG] 🔍 get_trip() cridada amb trip_id={trip_id}")
    trip = get_trip_by_id(trip_id)
    if not trip:
        print(f"[ERROR] ❌ Trip no trobada amb ID: {trip_id}")
        raise HTTPException(status_code=404, detail="Trip not found")

    print(f"[DEBUG] 🧮 Calculant avgRating dinàmic per {trip_id}")
    trip.update(get_trip_rating_stats(trip_id))
    return trip


# ============================================================
# 🚀 Crear Trip (Multipart + Geocoding)
# ============================================================
@router.post(
    "/",
    summary="Crear una trip (multipart amb JSON + imatges)",
    description="Pujar una trip amb imatges, punts i geolocalització.",
)
async def create_trip_multipart(
    trip_json: str = Form(...),
    cover: Optional[UploadFile] = File(None),
    gallery: Optional[List[UploadFile]] = File(None),
    point_images: Optional[List[UploadFile]] = File(None),
):
    print("\n[DEBUG] 🚀 create_trip_multipart() cridada")
    print(f"[DEBUG] trip_json rebut: {trip_json[:300]}...")

    try:
        # 1️⃣ Validar JSON
        data = TripCreateIn.model_validate_json(trip_json)
        print(f"[DEBUG] ✅ JSON parsejat correctament. Títol: {data.title}")

        # 2️⃣ Pujar imatges
        print(f"[DEBUG] 🖼️ Pujant cover: {cover.filename if cover else 'No cover'}")
        cover_url = upload_image_to_imgbb(cover) if cover else None

        print(f"[DEBUG] 📸 Pujant {len(gallery or [])} imatges de galeria")
        gallery_urls = [upload_image_to_imgbb(f) for f in (gallery or [])]

        # 3️⃣ Processar punts del recorregut
        points_with_images = []
        for i, p in enumerate(data.trip_points):
            print(f"\n[DEBUG] ➡️ Processant punt #{i+1}: {p.title}")
            img_url = None
            if point_images and i < len(point_images) and point_images[i] is not None:
                print(
                    f"[DEBUG] 🖼️ Pujant imatge del punt: {point_images[i].filename}"
                )
                img_url = upload_image_to_imgbb(point_images[i])

            coords = p.coordinates
            print(f"[DEBUG] 📍 Coordenades del punt (raw): {coords}")
            print(f"[DEBUG] 🧩 Tipus de coordenades: {type(coords)}")
            location_name = "Ubicació desconeguda"

            try:
                # ✅ Detectar si es dict o model
                if hasattr(coords, "lat") and hasattr(coords, "lng"):
                    lat, lon = coords.lat, coords.lng
                elif isinstance(coords, dict):
                    lat = coords.get("lat") or coords.get("latitude")
                    lon = coords.get("lng") or coords.get("longitude")
                else:
                    lat = lon = None

                print(f"[DEBUG] 🌐 Coordenades parsejades: lat={lat}, lon={lon}")

                if lat is not None and lon is not None:
                    print("[DEBUG] 🌍 Cridant a get_location_name()...")
                    location_name = get_location_name(lat, lon)
                    print(f"[DEBUG] 🗺️ Resultat del geocoding: {location_name}")
                    time.sleep(1)  # evita rate limit
                else:
                    print("[DEBUG] ⚠️ No s'han coordenades vàlides.")

            except Exception as geo_err:
                print(
                    f"[ERROR] ❌ Error processant coordenades del punt {p.title}: {geo_err}"
                )
                location_name = "Error al geocodificar"

            points_with_images.append(
                {**p.dict(), "image": img_url, "location_name": location_name}
            )

        # 4️⃣ Construir objecte TripModel
        print(f"\n[DEBUG] 🏗️ Construint objecte TripModel per '{data.title}'")
        trip_to_store = TripModel(
            title=data.title,
            description=data.description,
            category=data.category,
            tags=data.tags,
            author=data.author.dict(),
            city=data.city,
            region=data.region,
            country=data.country,
            routeMap=data.routeMap,
            trip_points=points_with_images,
            distance=data.distance,
            duration=data.duration,
            difficulty=data.difficulty,
            recommendedSeason=data.recommendedSeason,
            coverImage=cover_url,
            gallery=gallery_urls,
        )

        # 5️⃣ Guardar a MongoDB
        print("[DEBUG] 💾 Guardant trip a MongoDB...")
        inserted_id = save_trip(trip_to_store.dict())
        print(f"[DEBUG] ✅ Trip guardada amb ID: {inserted_id}")

        return {
            "message": "Trip creada correctament",
            "trip_id": inserted_id,
            "trip": trip_to_store,
        }

    except Exception as e:
        print(f"[ERROR] ❌ Error en create_trip_multipart: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================
# ⭐ Afegir o actualizar valoració
# ============================================================
@router.post("/{trip_id}/rating")
def add_trip_rating(
    trip_id: str,
    userId: str = Body(...),
    rating: int = Body(..., ge=1, le=5),
):
    """
    Afageix o actualitza una valoració (rating) de 1 a 5 per a una trip.
    """
    print(
        f"\n[DEBUG] ⭐ add_trip_rating() -> trip_id={trip_id}, userId={userId}, rating={rating}"
    )
    upsert_rating(trip_id, userId, rating, datetime.utcnow())
    print("[DEBUG] ✅ Rating guardat o actualizat correctament")
    return {"message": "Rating afegit o actualizat"}
