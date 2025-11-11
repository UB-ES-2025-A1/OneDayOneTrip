# api/tests/conftest.py
import os
import sys
import types

# 1) Modo test -> mongomock en mongo_service
os.environ.setdefault("APP_ENV", "test")

# 2) Evita KeyError de credenciales Firebase en import
os.environ.setdefault("FIREBASE_CREDENTIALS", "{}")

# 3) Stub completo de firebase_admin (credentials, firestore, auth, _apps)
if "firebase_admin" not in sys.modules:
    fake_admin = types.ModuleType("firebase_admin")
    fake_admin.__file__ = "<stubbed>"
    fake_admin._apps = []  # lo comprueba firebase_service

    # --- credentials ---
    fake_creds = types.ModuleType("firebase_admin.credentials")
    def Certificate(data):
        return object()
    fake_creds.Certificate = Certificate

    # --- firestore ---
    fake_fs = types.ModuleType("firebase_admin.firestore")
    class _FakeFirestoreClient:
        def collection(self, *args, **kwargs):
            return object()
    def client():
        return _FakeFirestoreClient()
    fake_fs.client = client

    # --- auth ---
    fake_auth = types.ModuleType("firebase_admin.auth")

    class InvalidIdTokenError(Exception): ...
    class ExpiredIdTokenError(Exception): ...
    class RevokedIdTokenError(Exception): ...

    def verify_id_token(token, check_revoked=False):
        # payload mínimo válido para tests
        return {"uid": "test-user", "email": "test@example.com"}

    fake_auth.InvalidIdTokenError = InvalidIdTokenError
    fake_auth.ExpiredIdTokenError = ExpiredIdTokenError
    fake_auth.RevokedIdTokenError = RevokedIdTokenError
    fake_auth.verify_id_token = verify_id_token

    # --- initialize_app ---
    def initialize_app(cred=None, **kwargs):
        app_obj = object()
        fake_admin._apps.append(app_obj)
        return app_obj

    # Colgar submódulos como ATRIBUTOS del paquete (clave para `from firebase_admin import auth`)
    fake_admin.credentials = fake_creds
    fake_admin.firestore = fake_fs
    fake_admin.auth = fake_auth
    fake_admin.initialize_app = initialize_app

    # Registrar en sys.modules
    sys.modules["firebase_admin"] = fake_admin
    sys.modules["firebase_admin.credentials"] = fake_creds
    sys.modules["firebase_admin.firestore"] = fake_fs
    sys.modules["firebase_admin.auth"] = fake_auth
