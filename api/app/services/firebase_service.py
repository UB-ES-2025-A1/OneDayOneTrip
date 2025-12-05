import os
import json
from dotenv import load_dotenv

import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()  # carrega variables de .env si existeixen

# ==========================================================
# 🔐 Inicailització segura de Firebase
# ==========================================================
firebase_credentials_str = os.environ.get("FIREBASE_CREDENTIALS")

try:
    if firebase_credentials_str:
        firebase_credentials = json.loads(firebase_credentials_str)
        cred = credentials.Certificate(firebase_credentials)

        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)

        db = firestore.client()
        print("[INFO] ✅ Firestore inicialitzat correctament.")
    else:
        raise ValueError("FIREBASE_CREDENTIALS no està definit")

except Exception as e:
    print(f"[WARN] ⚠️ No s'ha pogut inicialitzar Firebase: {e}")
    print("[INFO] 🧪 Utilitzant Mock de Firebase per entorn de test.")

    class MockFirestore:
        def collection(self, name):
            print(f"[MOCK] Firestore.collection('{name}') cridat.")
            return self

        def document(self, uid):
            print(f"[MOCK] Firestore.document('{uid}') cridat.")
            return self

        def set(self, data, merge=False):
            print(f"[MOCK] Firestore.set() cridat amb data={data}")
            return None

        def get(self):
            return []

    db = MockFirestore()
