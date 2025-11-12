import os
import json
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()  # carga variables de .env si existen

# ==========================================================
# 🔐 Inicialización segura de Firebase
# ==========================================================
firebase_credentials_str = os.environ.get("FIREBASE_CREDENTIALS")

try:
    if firebase_credentials_str:
        firebase_credentials = json.loads(firebase_credentials_str)
        cred = credentials.Certificate(firebase_credentials)

        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)

        db = firestore.client()
        print("[INFO] ✅ Firestore inicializado correctamente.")
    else:
        raise ValueError("FIREBASE_CREDENTIALS no está definido")

except Exception as e:
    print(f"[WARN] ⚠️ No se pudo inicializar Firebase: {e}")
    print("[INFO] 🧪 Usando mock de Firestore para entorno de test.")

    class MockFirestore:
        def collection(self, name):
            print(f"[MOCK] Firestore.collection('{name}') llamado.")
            return self

        def document(self, uid):
            print(f"[MOCK] Firestore.document('{uid}') llamado.")
            return self

        def set(self, data, merge=False):
            print(f"[MOCK] Firestore.set() llamado con data={data}")
            return None

        def get(self):
            return []

    db = MockFirestore()
