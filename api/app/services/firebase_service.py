import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Obtener JSON desde variable de entorno
firebase_key = json.loads(os.environ["FIREBASE_CREDENTIALS"])

cred = credentials.Certificate(firebase_key)

# Inicializar solo una vez (evita error de "app already exists")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
