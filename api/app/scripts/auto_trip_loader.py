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
            "title": "Un dia per València: CAC i Centre Històric",
            "description": "Ruta que combina la Ciutat de les Arts i les Ciències amb icones del centre històric de València.",
            "category": "Cultural, arquitectura",
            "tags": ["València", "arquitectura", "història", "CAC"],
            "author": {
                "userId": "uid_000",
                "name": "OneDayOneTrip",
                "profilePic": "https://i.ibb.co/3YTRDy4h/f23488394ee0.jpg"
            },
            "city": "València",
            "region": "Comunitat Valenciana",
            "country": "España",
            "trip_points": [
                {
                    "title": "L'Hemisfèric",
                    "description": "L’icònic ‘ull’ de la Ciutat de les Arts i les Ciències.",
                    "coordinates": {"lat": 39.4575, "lng": -0.3540},
                    "image": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Hemispheric_-_Valencia%2C_Spain_-_Jan_2007.jpg"
                },
                {
                    "title": "L’Oceanogràfic",
                    "description": "El major aquari d’Europa; arquitectura de Candela.",
                    "coordinates": {"lat": 39.4549, "lng": -0.3512},
                    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d4/L%27Oceanografic_%28Valencia%2C_Spain%29_01.jpg"
                },
                {
                    "title": "Torres de Serrans",
                    "description": "Porta medieval de la ciutat, perfectament conservada.",
                    "coordinates": {"lat": 39.4791, "lng": -0.3769},
                    "image": "https://upload.wikimedia.org/wikipedia/commons/5/59/Torres_de_Serranos_%28Valencia%29.jpg"
                },
                {
                    "title": "La Llotja de la Seda",
                    "description": "Joia gòtica civil Patrimoni de la Humanitat.",
                    "coordinates": {"lat": 39.4742, "lng": -0.3786},
                    "image": "https://upload.wikimedia.org/wikipedia/commons/7/7d/Spain_Valencia_-_Lonja_de_la_Seda.jpg"
                }
            ],
            "distance": 8,
            "duration": "4 hores",
            "difficulty": "Fàcil",
            "recommendedSeason": "Primavera",
            "coverImage": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Panor%C3%A0mica_Ciutat_de_les_Arts_i_les_Ci%C3%A8ncies.jpg",
            "gallery": [
                "https://upload.wikimedia.org/wikipedia/commons/8/81/Mercado_Central_Valencia.JPG",
                "https://upload.wikimedia.org/wikipedia/commons/8/8a/Valencia_-_Plaza_de_la_Virgen_01.jpg"
            ]
        }
    ]

    uploader.upload_trips(trips)
