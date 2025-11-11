# test_users_endpoints.py
# Requiere los stubs de verify_token y firebase_service del conftest
def test_users_register_and_get(client):
    # register
    payload = {"fullname":"Jesús", "username":"jesusrun", "mail":"j@ex.com"}
    r = client.post("/users/register", json=payload, headers={"Authorization":"Bearer FAKE"})
    assert r.status_code == 200
    # list users
    r2 = client.get("/users/", headers={"Authorization":"Bearer FAKE"})
    assert r2.status_code == 200
    assert isinstance(r2.json(), list)
    # me
    r3 = client.get("/users/me", headers={"Authorization":"Bearer FAKE"})
    assert r3.status_code == 200
    assert r3.json()["uid"] == "u1"