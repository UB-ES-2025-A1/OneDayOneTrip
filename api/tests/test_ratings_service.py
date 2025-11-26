from datetime import datetime
from bson import ObjectId

from app.services import mongo_service


def test_get_trip_rating_stats_returns_round_values(monkeypatch):
    trip_id = "507f1f77bcf86cd799439011"
    captured = {}

    class FakeRatingsCollection:
        def aggregate(self, pipeline):
            captured["pipeline"] = pipeline
            return [
                {
                    "_id": ObjectId(trip_id),
                    "avg": 4.3333,
                    "count": 3,
                }
            ]

    monkeypatch.setattr(mongo_service, "ratings_collection", FakeRatingsCollection())

    stats = mongo_service.get_trip_rating_stats(trip_id)

    assert stats == {"avgRating": 4.33, "numRatings": 3}
    pipeline = captured["pipeline"]
    assert pipeline[0]["$match"]["tripId"] == ObjectId(trip_id)
    assert "$group" in pipeline[1]


def test_get_trip_rating_stats_returns_defaults_on_error(monkeypatch):
    class BrokenCollection:
        def aggregate(self, pipeline):
            raise RuntimeError("db down")

    monkeypatch.setattr(mongo_service, "ratings_collection", BrokenCollection())

    stats = mongo_service.get_trip_rating_stats("invalid")

    assert stats == {"avgRating": 0.0, "numRatings": 0}


def test_upsert_rating_uses_object_id(monkeypatch):
    trip_id = "507f1f77bcf86cd799439011"
    captured = {}

    class FakeRatingsCollection:
        def update_one(self, filter_query, update_doc, upsert):
            captured["filter"] = filter_query
            captured["update"] = update_doc
            captured["upsert"] = upsert

    monkeypatch.setattr(mongo_service, "ratings_collection", FakeRatingsCollection())

    mongo_service.upsert_rating(trip_id, "user-123", 5, datetime(2024, 1, 1))

    assert captured["filter"]["tripId"] == ObjectId(trip_id)
    assert captured["filter"]["userId"] == "user-123"
    assert captured["update"]["$set"]["rating"] == 5
    assert captured["upsert"] is True
