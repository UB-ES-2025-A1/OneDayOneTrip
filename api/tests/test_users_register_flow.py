# api/tests/test_users_register_flow.py
import pytest
from fastapi.testclient import TestClient

BASE_HEADERS = {"Authorization": "Bearer FAKE"}  # auth stub de conftest
Q = "?_a=x&_k=y"

def _payload_user(n=1):
    return {
        "fullname": f"Usuario {n}",
        "username": f"jesusrun{n}",
        "mail": f"j{n}@ex.com",
        # NOTA: tu /users/register actual no exige password
    }

def test_register_ok_returns_user(client: TestClient):
    r = client.post(f"/users/register{Q}", json=_payload_user(1), headers=BASE_HEADERS)
    assert r.status_code in (200, 201), r.text
    data = r.json()
    # Estructura actual: {"message": "...", "user": {...}}
    assert "user" in data, data
    u = data["user"]
    # En la rama actual, siempre hay uid "test-user"
    assert u.get("uid") == "test-user"
    # Los campos enviados suelen rebotar en la respuesta, pero no los hacemos estrictos
    # por si el router no los refleja todos.
    assert "role" in u  # suele ser "user"

def test_register_missing_fields_is_currently_accepted(client: TestClient):
    # Tu API actual acepta {} y devuelve 200 con user parcial/null -> documentamos comportamiento
    r = client.post(f"/users/register{Q}", json={}, headers=BASE_HEADERS)
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert "user" in data
    assert data["user"].get("uid") == "test-user"

def test_register_duplicate_email_username_is_currently_allowed(client: TestClient):
    first = _payload_user(2)
    r1 = client.post(f"/users/register{Q}", json=first, headers=BASE_HEADERS)
    assert r1.status_code in (200, 201), r1.text

    # Duplicado por email (la API actual NO bloquea)
    dup_email = {**_payload_user(3), "mail": first["mail"]}
    r2 = client.post(f"/users/register{Q}", json=dup_email, headers=BASE_HEADERS)
    assert r2.status_code in (200, 201), r2.text

    # Duplicado por username (la API actual NO bloquea)
    dup_username = {**_payload_user(4), "username": first["username"]}
    r3 = client.post(f"/users/register{Q}", json=dup_username, headers=BASE_HEADERS)
    assert r3.status_code in (200, 201), r3.text

def test_me_without_auth_returns_404_in_current_stub(client: TestClient):
    # Tu implementación devuelve 404 ("Usuario no encontrado") cuando no hay Authorization
    r = client.get(f"/users/me{Q}")
    assert r.status_code == 404, r.text
