import requests
import json
import io
from typing import List, Dict
from urllib.parse import urlparse

class TripUploader:
    def __init__(self, api_url: str):
        self.api_url = api_url.rstrip("/")
        self.endpoint = f"{self.api_url}/trips/"

        # ✅ Sesión con headers adecuados (Wikimedia exige UA identificable)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "OneDayOneTrip-Uploader/1.0 "
                "(https://onedayonetrip.example; contacto: admin@onedayonetrip.example) "
                "Mozilla/5.0"
            ),
            "Accept": "image/*,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9",
            # Referer razonable para Wikimedia Commons
            "Referer": "https://commons.wikimedia.org/"
        })

    def _download_image(self, url: str):
        try:
            # permite redirecciones y lee binario
            resp = self.session.get(url, timeout=20)  # allow_redirects=True por defecto
            resp.raise_for_status()

            ctype = resp.headers.get("Content-Type", "")
            if "image" not in ctype:
                raise ValueError(f"La URL no parece ser una imagen válida: {url} (Content-Type={ctype})")

            filename = urlparse(url).path.split("/")[-1] or "image.jpg"
            return (filename, io.BytesIO(resp.content), ctype)

        except Exception as e:
            print(f"⚠️ Error al descargar imagen {url}: {e}")
            return None

    def upload_trips(self, trips: List[Dict]):
        results = []
        for i, trip_data in enumerate(trips):
            print(f"\n🚀 Subiendo trip {i+1}/{len(trips)}: {trip_data.get('title')}")

            cover_file = None
            gallery_files = []
            point_files = []

            if trip_data.get("coverImage"):
                cover_file = self._download_image(trip_data["coverImage"])

            for url in trip_data.get("gallery", []):
                img = self._download_image(url)
                if img:
                    gallery_files.append(img)

            for p in trip_data.get("trip_points", []):
                url = p.get("image")
                img = self._download_image(url) if url else None
                point_files.append(img if img else None)

            json_trip = trip_data.copy()
            for p in json_trip.get("trip_points", []):
                p.pop("image", None)
            json_trip.pop("coverImage", None)
            json_trip.pop("gallery", None)

            # ✅ Formato correcto para listas en FastAPI (mismo nombre repetido)
            multipart = [
                ("trip_json", (None, json.dumps(json_trip), "application/json"))
            ]
            if cover_file:
                multipart.append(("cover", cover_file))
            for g in gallery_files:
                multipart.append(("gallery", g))
            for p in point_files:
                if p:
                    multipart.append(("point_images", p))

            try:
                response = self.session.post(self.endpoint, files=multipart, timeout=60)
                if response.status_code == 200:
                    print(f"✅ Trip '{trip_data['title']}' subida correctamente.")
                else:
                    print(f"❌ Error al subir trip '{trip_data['title']}': {response.text}")
                results.append(response.json())
            except Exception as e:
                print(f"💥 Error al conectar con la API: {e}")
                results.append({"error": str(e)})

        return results



# ───────────────────────────────────────────────
# 🧪 Ejemplo de uso manual
# ───────────────────────────────────────────────
if __name__ == "__main__":
    uploader = TripUploader(api_url="http://localhost:8000")

    trips = [
            {
                "title": "Descobrint Roma en un dia",
                "description": "Ruta que combina els principals monuments de Roma amb activitats culturals i gastronòmiques en un dia.",
                "category": "Cultural, Història, Gastronomia",
                "tags": ["Roma", "Itàlia", "història", "monuments"],
                "author": {
                    "userId": "uid_000",
                    "name": "OneDayOneTrip",
                    "profilePic": "https://i.ibb.co/v6XYGkyM/3f1fc17a6277.jpg"
                },
                "city": "Roma",
                "region": "Lazio",
                "country": "Itàlia",
                "trip_points": [
                    {
                        "title": "Coliseu",
                        "description": "L’emblemàtic amfiteatre romà, símbol de la grandesa de l’Antiga Roma.",
                        "coordinates": {"lat": 41.8902, "lng": 12.4922},
                        "image": "https://slevomat.sgcdn.cz/images/t/2000/16/63/16638432-d4d82e.jpg"
                    },
                    {
                        "title": "Fòrum Romà i Palatí",
                        "description": "Centre polític i religiós de la Roma antiga; passeig entre ruïnes mil·lenàries.",
                        "coordinates": {"lat": 41.8925, "lng": 12.4853},
                        "image": "https://karanlathia.com/wp-content/uploads/2022/07/Roman-Forum-1-768x432.jpg"
                    },
                    {
                        "title": "Fontana di Trevi",
                        "description": "Una de les fonts més famoses del món; llença una moneda per tornar a Roma.",
                        "coordinates": {"lat": 41.9009, "lng": 12.4833},
                        "image": "https://www.romando.org/wp-content/uploads/sites/14/2023/07/fontana-di-trevi-nocturno.jpg?width=632"
                    },
                    {
                        "title": "Panteó de Roma",
                        "description": "Temple romà reconvertit en església, amb la cúpula més gran del món antic.",
                        "coordinates": {"lat": 41.8986, "lng": 12.4768},
                        "image": "https://www.101viajes.com/sites/default/files/panteon-roma-exterior.jpg"
                    }
                ],
                "distance": 10,
                "duration": "8 hores",
                "difficulty": "Fàcil",
                "recommendedSeason": "Estiu",
                "coverImage": "https://para-viajar.com/wp-content/uploads/2010/09/El-Coliseo-Romano.jpg",
                "gallery": [
                    "https://www.loleta.es/wp-content/uploads/2019/09/web-ROMA-IG1-5120282-copia-1080x675.jpg",
                    "https://ik.imagekit.io/f8xal2viyc0/content/Untitled-5_DtTa2icdg.jpeg"
                ]
            }
    ]

    uploader.upload_trips(trips)
