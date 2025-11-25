def test_root_smoke(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "API funcionando"


def test_trips_smoke(client):
    response = client.get("/trips/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_users_smoke(client):
    response = client.get("/users/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
