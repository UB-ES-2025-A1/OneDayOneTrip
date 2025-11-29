from types import SimpleNamespace
from app.routers import comments as comments_router


def _mock_comments_collection(monkeypatch, captured):
    class FakeCollection:
        def insert_one(self, doc):
            captured["doc"] = doc
            return SimpleNamespace(inserted_id="c1")

    monkeypatch.setattr(comments_router, "comments_collection", FakeCollection())


def test_create_comment_success(client, monkeypatch):
    captured = {}
    _mock_comments_collection(monkeypatch, captured)

    payload = {
        "tripId": "507f1f77bcf86cd799439011",
        "userId": "u1",
        "userName": "Test User",
        "text": "Gran ruta!",
    }

    response = client.post("/trips/507f1f77bcf86cd799439011/comments", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["comment"]["_id"] == "c1"
    assert captured["doc"]["text"] == "Gran ruta!"


def test_create_comment_rejects_invalid_trip_id(client):
    payload = {
        "tripId": "invalid",
        "userId": "u1",
        "userName": "Test User",
        "text": "Gran ruta!",
    }

    response = client.post("/trips/invalid/comments", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "tripId invàlid"


def test_get_comments_uses_list_comments(client, monkeypatch):
    fake_data = [
        {"_id": "c2", "tripId": "t1", "userName": "B", "text": "Hola"},
        {"_id": "c1", "tripId": "t1", "userName": "A", "text": "Adéu"},
    ]

    def fake_list(trip_id, limit, skip):
        assert trip_id == "t1"
        assert limit == 20
        assert skip == 0
        return fake_data

    monkeypatch.setattr("app.routers.comments.list_comments", fake_list)

    response = client.get("/trips/t1/comments")
    assert response.status_code == 200
    assert response.json()["comments"] == fake_data
