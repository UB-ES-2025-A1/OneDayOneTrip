# tests/test_trips_endpoints.py
import json

import pytest
from fastapi import status


@pytest.mark.usefixtures("client")
class TestTripsEndpoints:

    def test_list_trips(self, client):
        response = client.get("/trips/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert all("_id" in t for t in data)

    def test_get_trip_by_id_found(self, client):
        response = client.get("/trips/t1")
        assert response.status_code == status.HTTP_200_OK
        trip = response.json()
        assert trip["_id"] == "t1"
        assert "avgRating" in trip

    def test_get_trip_by_id_not_found(self, client):
        response = client.get("/trips/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json()["detail"] == "Trip not found"

    def test_create_trip_multipart(self, client, tmp_path):
        # Crear un JSON válido
        trip_json = {
            "title": "Fake trip",
            "description": "A fun fake trip",
            "category": "nature",
            "tags": ["fake", "test"],
            "author": {"userId": "u1", "name": "Tester"},  # 👈 cambiado de uid → userId
            "city": "Madrid",
            "region": "Madrid",
            "country": "España",
            "routeMap": [{"lat": 40.4, "lng": -3.7}],  # 👈 ahora es una lista de dicts
            "trip_points": [
                {
                    "title": "Point 1",
                    "coordinates": {"lat": 40.4, "lng": -3.7},
                }
            ],
            "distance": 5.0,
            "duration": "2h",
            "difficulty": "easy",
            "recommendedSeason": "summer",
        }

        response = client.post(
            "/trips/",
            data={"trip_json": json.dumps(trip_json)},
            files={},  # sin imágenes reales
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "trip_id" in data
        assert data["trip_id"] == "mock_trip_id_123"

    def test_add_comment(self, client, monkeypatch):
        captured = {}

        class FakeCollection:
            def insert_one(self, doc):
                captured["doc"] = doc
                return type("Res", (), {"inserted_id": "c123"})()

        monkeypatch.setattr(
            "app.routers.comments.comments_collection", FakeCollection()
        )

        body = {
            "tripId": "507f1f77bcf86cd799439011",
            "userId": "u1",
            "userName": "Tester",
            "text": "Bon viatge!",
        }
        response = client.post("/trips/507f1f77bcf86cd799439011/comments", json=body)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["comment"]["_id"] == "c123"
        assert captured["doc"]["text"] == "Bon viatge!"

    def test_add_rating(self, client):
        body = {"userId": "u1", "rating": 5}
        response = client.post("/trips/t1/rating", json=body)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Rating afegit o actualitzat"

    # def test_get_trip_comments(self, client):
    #     response = client.get("/trips/t1/comments")
    #     assert response.status_code == status.HTTP_200_OK
    #     data = response.json()
    #     assert "comments" in data
    #     assert isinstance(data["comments"], list)
    #     assert data["count"] == len(data["comments"])
