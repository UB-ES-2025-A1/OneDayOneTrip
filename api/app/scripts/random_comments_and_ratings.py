import requests
import random
import time
from datetime import datetime

API_URL = "http://localhost:8000/trips"

# Algunos nombres y comentarios de ejemplo
USER_NAMES = [
    ("uid_001", "Maria"),
    ("uid_002", "Joan"),
    ("uid_003", "Lucía"),
    ("uid_004", "Carlos"),
    ("uid_005", "Anna"),
]

COMMENTS = [
    "Ruta espectacular! 🌟",
    "Perfecta per un dia assolellat!",
    "Molt recomanable, sobretot el punt final.",
    "Em va encantar, repetiré segur!",
    "Una mica llarga però molt completa.",
    "Ideal per fer amb amics o família.",
    "Bon paisatge i bona organització.",
    "Les fotos no fan justícia, molt millor en persona!",
]


def get_all_trips():
    print("📦 Obtenint totes les trips...")
    resp = requests.get(API_URL)
    resp.raise_for_status()
    return resp.json()


def add_random_comment(trip_id, userId, userName):
    comment = random.choice(COMMENTS)
    payload = {"userId": userId, "userName": userName, "content": comment}
    resp = requests.post(f"{API_URL}/{trip_id}/comment", json=payload)
    if resp.status_code == 200:
        print(f"💬 Comentario añadido a {trip_id}: {comment}")
    else:
        print(f"⚠️ Error al añadir comentario: {resp.text}")


def add_random_rating(trip_id, userId):
    rating = random.randint(3, 5)
    payload = {"userId": userId, "rating": rating}
    resp = requests.post(f"{API_URL}/{trip_id}/rating", json=payload)
    if resp.status_code == 200:
        print(f"⭐ Rating {rating} añadido a {trip_id}")
    else:
        print(f"⚠️ Error al añadir rating: {resp.text}")


def populate_all_trips():
    trips = get_all_trips()
    print(f"🔢 {len(trips)} trips encontradas.")
    for t in trips:
        trip_id = t["_id"]
        print(f"\n🚀 Procesando trip: {t.get('title', '(sin título)')}")
        for uid, uname in random.sample(USER_NAMES, k=random.randint(2, 4)):
            add_random_comment(trip_id, uid, uname)
            add_random_rating(trip_id, uid)
            time.sleep(0.5)  # pequeña pausa para evitar saturar el servidor


if __name__ == "__main__":
    populate_all_trips()
