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
# 🌍 Geocodificación con Debug
# ============================================================
def get_location_name(lat: float, lon: float) -> str:
    """Convierte coordenadas (lat, lon) en nombre de ubicación legible (con debug)."""
    print(f"\n[DEBUG] 🌍 get_location_name() llamada con lat={lat}, lon={lon}")
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {"format": "jsonv2", "lat": lat, "lon": lon, "accept-language": "es"}
        headers = {
            "User-Agent": "OneDayOneTrip/1.0 (https://onedayonecity.web.app; contacto: admin@onedayonetrip.com)"
        }

        print(f"[DEBUG] 🔗 Haciendo petición GET a {url} con params={params}")
        resp = requests.get(url, params=params, headers=headers, timeout=8)
        print(f"[DEBUG] ✅ Respuesta HTTP: {resp.status_code}")

        resp.raise_for_status()
        data = resp.json()
        print(
            f"[DEBUG] 📦 JSON recibido: {json.dumps(data, indent=2, ensure_ascii=False)[:400]}..."
        )

        name = (
            data.get("display_name")
            or data.get("name")
            or ", ".join(data.get("address", {}).values())
        )
        print(f"[DEBUG] 📍 Nombre detectado: {name}")
        return name if name else "Ubicación desconocida"

    except Exception as e:
        print(f"[ERROR] ⚠️ Error geocoding ({lat},{lon}): {e}")
        return "Ubicación desconocida"


# ============================================================
# 📋 Endpoints
# ============================================================


@router.get("/")
def list_trips(include_stats: bool = False):
    print(f"\n[DEBUG] 📄 list_trips() llamado con include_stats={include_stats}")
    trips = get_all_trips()
    print(f"[DEBUG] 📊 Número de trips recuperadas: {len(trips)}")

    if include_stats:
        for t in trips:
            print(f"[DEBUG] Calculando estadísticas para trip_id={t['_id']}")
            stats = get_trip_rating_stats(t["_id"])
            t.update(stats)
    return trips


@router.get("/{trip_id}")
def get_trip(trip_id: str):
    print(f"\n[DEBUG] 🔍 get_trip() llamado con trip_id={trip_id}")
    trip = get_trip_by_id(trip_id)
    if not trip:
        print(f"[ERROR] ❌ Trip no encontrada con ID: {trip_id}")
        raise HTTPException(status_code=404, detail="Trip not found")

    print(f"[DEBUG] 🧮 Calculando avgRating dinámico para {trip_id}")
    trip.update(get_trip_rating_stats(trip_id))
    return trip


# ============================================================
# 🚀 Crear Trip (Multipart + Geocoding)
# ============================================================
@router.post(
    "/",
    summary="Crear una trip (multipart con JSON + imágenes)",
    description="Sube una trip con imágenes, puntos y geolocalización.",
)
async def create_trip_multipart(
    trip_json: str = Form(...),
    cover: Optional[UploadFile] = File(None),
    gallery: Optional[List[UploadFile]] = File(None),
    point_images: Optional[List[UploadFile]] = File(None),
):
    print("\n[DEBUG] 🚀 create_trip_multipart() llamado")
    print(f"[DEBUG] trip_json recibido: {trip_json[:300]}...")

    try:
        # 1️⃣ Validar JSON
        data = TripCreateIn.model_validate_json(trip_json)
        print(f"[DEBUG] ✅ JSON parseado correctamente. Título: {data.title}")

        # 2️⃣ Subir imágenes
        print(f"[DEBUG] 🖼️ Subiendo cover: {cover.filename if cover else 'No cover'}")
        cover_url = upload_image_to_imgbb(cover) if cover else None

        print(f"[DEBUG] 📸 Subiendo {len(gallery or [])} imágenes de galería")
        gallery_urls = [upload_image_to_imgbb(f) for f in (gallery or [])]

        # 3️⃣ Procesar puntos del recorrido
        points_with_images = []
        for i, p in enumerate(data.trip_points):
            print(f"\n[DEBUG] ➡️ Procesando punto #{i+1}: {p.title}")
            img_url = None
            if point_images and i < len(point_images) and point_images[i] is not None:
                print(
                    f"[DEBUG] 🖼️ Subiendo imagen del punto: {point_images[i].filename}"
                )
                img_url = upload_image_to_imgbb(point_images[i])

            coords = p.coordinates
            print(f"[DEBUG] 📍 Coordenadas del punto (raw): {coords}")
            print(f"[DEBUG] 🧩 Tipo de coordenadas: {type(coords)}")
            location_name = "Ubicación desconocida"

            try:
                # ✅ Detectar si es dict o modelo
                if hasattr(coords, "lat") and hasattr(coords, "lng"):
                    lat, lon = coords.lat, coords.lng
                elif isinstance(coords, dict):
                    lat = coords.get("lat") or coords.get("latitude")
                    lon = coords.get("lng") or coords.get("longitude")
                else:
                    lat = lon = None

                print(f"[DEBUG] 🌐 Coordenadas parseadas: lat={lat}, lon={lon}")

                if lat is not None and lon is not None:
                    print("[DEBUG] 🌍 Llamando a get_location_name()...")
                    location_name = get_location_name(lat, lon)
                    print(f"[DEBUG] 🗺️ Resultado del geocoding: {location_name}")
                    time.sleep(1)  # evita rate limit
                else:
                    print("[DEBUG] ⚠️ No se encontraron coordenadas válidas.")

            except Exception as geo_err:
                print(
                    f"[ERROR] ❌ Error procesando coordenadas del punto {p.title}: {geo_err}"
                )
                location_name = "Error al geocodificar"

            points_with_images.append(
                {**p.dict(), "image": img_url, "location_name": location_name}
            )

        # 4️⃣ Construir objeto TripModel
        print(f"\n[DEBUG] 🏗️ Construyendo objeto TripModel para '{data.title}'")
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

        # 5️⃣ Guardar en MongoDB
        print("[DEBUG] 💾 Guardando trip en MongoDB...")
        inserted_id = save_trip(trip_to_store.dict())
        print(f"[DEBUG] ✅ Trip guardada con ID: {inserted_id}")

        return {
            "message": "Trip creada correctamente",
            "trip_id": inserted_id,
            "trip": trip_to_store,
        }

    except Exception as e:
        print(f"[ERROR] ❌ Error en create_trip_multipart: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================
# ⭐ Añadir o actualizar valoración
# ============================================================
@router.post("/{trip_id}/rating")
def add_trip_rating(
    trip_id: str,
    userId: str = Body(...),
    rating: int = Body(..., ge=1, le=5),
):
    """
    Añade o actualiza una valoración (rating) de 1 a 5 para una trip.
    """
    print(
        f"\n[DEBUG] ⭐ add_trip_rating() -> trip_id={trip_id}, userId={userId}, rating={rating}"
    )
    upsert_rating(trip_id, userId, rating, datetime.utcnow())
    print("[DEBUG] ✅ Rating guardado o actualizado correctamente")
    return {"message": "Rating añadido o actualizado"}
