from fastapi import status


def test_rate_trip_returns_stats(client, monkeypatch):
    captured = {}

    def fake_upsert(trip_id, user_id, rating, date):
        captured["args"] = (trip_id, user_id, rating)
        captured["date"] = date

    def fake_get_stats(trip_id):
        assert trip_id == "507f1f77bcf86cd799439011"
        return {"avgRating": 4.25, "numRatings": 12}

    monkeypatch.setattr("app.routers.ratings.upsert_rating", fake_upsert)
    monkeypatch.setattr("app.routers.ratings.get_trip_rating_stats", fake_get_stats)

    payload = {
        "userId": "u-1",
        "rating": 5,
        "date": "2024-01-01T00:00:00Z",
    }
    response = client.post("/ratings/trip/507f1f77bcf86cd799439011", json=payload)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"avgRating": 4.25, "numRatings": 12}
    assert captured["args"] == ("507f1f77bcf86cd799439011", "u-1", 5)
    assert captured["date"].isoformat().startswith("2024-01-01")


def test_rate_trip_returns_400_when_upsert_fails(client, monkeypatch):
    def broken_upsert(*_args, **_kwargs):
        raise RuntimeError("db down")

    monkeypatch.setattr("app.routers.ratings.upsert_rating", broken_upsert)

    response = client.post(
        "/ratings/trip/507f1f77bcf86cd799439011",
        json={"userId": "u-1", "rating": 1, "date": "2024-01-01T00:00:00Z"},
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "db down" in response.json()["detail"]
