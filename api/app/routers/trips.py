from app.models.trip_model import TripModel
from app.services.mongo_service import save_trip, get_all_trips, get_trip_by_id, get_trip_rating_stats
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from typing import List, Optional
from app.models.trip_create_in import TripCreateIn
from app.services.image_service import upload_image_to_imgbb
from app.services.mongo_service import save_trip
import json

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("/")
def list_trips(include_stats: bool = False):
    trips = get_all_trips()
    if include_stats:
        for t in trips:
            stats = get_trip_rating_stats(t["_id"])
            t.update(stats)
    return trips

@router.get("/{trip_id}")
def get_trip(trip_id: str):
    trip = get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    # ⭐ avgRating dinámico
    trip.update(get_trip_rating_stats(trip_id))
    return trip




@router.post("/",
    summary="Crear una trip (multipart con JSON + imágenes)",
    description="""
    Este endpoint acepta:
    - `trip_json`: JSON con los datos principales del viaje (sin imágenes)
    - `cover`: archivo de imagen principal
    - `gallery`: una o más imágenes para la galería
    - `point_images`: imágenes para los puntos del recorrido (en el mismo orden que 'trip_points')

    💡 **Ejemplo de `trip_json`:**

    ```json
    {
      "title": "Descobrint Barcelona",
      "description": "Ruta pels racons més emblemàtics...",
      "category": "Cultural, arquitectònica",
      "tags": ["modernisme","història"],
      "author": {
        "userId": "uid_001",
        "name": "Maria González",
        "profilePic": "https://i.ibb.co/avatar.png"
      },
      "city": "Barcelona",
      "region": "Catalunya",
      "country": "España",
      "trip_points": [
        {
          "title": "Plaça Catalunya",
          "description": "Inici de la ruta",
          "coordinates": {"lat": 41.387, "lng": 2.17}
        },
        {
          "title": "Parc de la Ciutadella",
          "description": "Final relaxant",
          "coordinates": {"lat": 41.388, "lng": 2.186}
        }
      ],
      "distance": 8,
      "duration": "5 hores",
      "difficulty": "Fàcil",
      "recommendedSeason": "Primavera"
    }
    ```
    """
)
async def create_trip_multipart(
    # JSON con todos los campos de texto (sin imágenes)
    trip_json: str = Form(...),

    # Archivos:
    cover: Optional[UploadFile] = File(None),                # portada
    gallery: Optional[List[UploadFile]] = File(None),        # varias imágenes de galería
    point_images: Optional[List[UploadFile]] = File(None)    # imágenes de puntos (mismo orden que trip_points)
):
    """
    Enviar:
    - trip_json: JSON string de TripCreateIn (sin imágenes).
    - cover: 1 archivo (opcional)
    - gallery: N archivos (opcional, usar misma key 'gallery' varias veces)
    - point_images: N archivos (opcional, usar misma key 'point_images' varias veces, orden = índices de trip_points)
    """
    try:
        data = TripCreateIn.model_validate_json(trip_json)

        # 1) Subidas a ImgBB
        cover_url = upload_image_to_imgbb(cover) if cover else None
        gallery_urls = [upload_image_to_imgbb(f) for f in (gallery or [])]

        # 2) Mapear imágenes de puntos por orden
        points_with_images = []
        for i, p in enumerate(data.trip_points):
            img_url = None
            if point_images and i < len(point_images) and point_images[i] is not None:
                img_url = upload_image_to_imgbb(point_images[i])
            points_with_images.append({
                **p.dict(),
                "image": img_url
            })

        # 3) Construir TripModel para guardar
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

        inserted_id = save_trip(trip_to_store.dict())
        return {
            "message": "Trip creada correctamente",
            "trip_id": inserted_id,
            "trip": trip_to_store
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
