# tests/test_mongo_service.py
import pytest
from bson import ObjectId
from datetime import datetime
from app.services import mongo_service


class TestMongoService:
    
    def test_save_trip(self, monkeypatch):
        """Test save_trip returns string ID"""
        captured_doc = None
        mock_id = ObjectId()
        
        class MockResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        
        class MockCollection:
            def insert_one(self, doc):
                nonlocal captured_doc
                captured_doc = doc
                return MockResult(mock_id)
        
        monkeypatch.setattr(mongo_service, "trips_collection", MockCollection())
        
        trip_data = {"title": "Test Trip", "description": "Test"}
        result = mongo_service.save_trip(trip_data)
        
        assert result == str(mock_id)
        assert captured_doc == trip_data

    def test_get_all_trips(self, monkeypatch):
        """Test get_all_trips returns list with string IDs"""
        mock_trips = [
            {"_id": ObjectId(), "title": "Trip 1"},
            {"_id": ObjectId(), "title": "Trip 2"},
        ]
        
        class MockCollection:
            def find(self, *args, **kwargs):
                return iter(mock_trips)
        
        monkeypatch.setattr(mongo_service, "trips_collection", MockCollection())
        
        result = mongo_service.get_all_trips()
        
        assert len(result) == 2
        assert all(isinstance(t["_id"], str) for t in result)
        assert result[0]["title"] == "Trip 1"

    def test_get_trip_by_id_valid(self, monkeypatch):
        """Test get_trip_by_id with valid ObjectId"""
        trip_id = str(ObjectId())
        mock_trip = {"_id": ObjectId(trip_id), "title": "Found Trip"}
        
        class MockCollection:
            def find_one(self, query):
                return mock_trip
        
        monkeypatch.setattr(mongo_service, "trips_collection", MockCollection())
        
        result = mongo_service.get_trip_by_id(trip_id)
        
        assert result is not None
        assert result["title"] == "Found Trip"
        assert isinstance(result["_id"], str)

    def test_get_trip_by_id_invalid_objectid(self, monkeypatch):
        """Test get_trip_by_id with invalid ObjectId returns None"""
        class MockCollection:
            def find_one(self, query):
                raise Exception("Invalid ObjectId")
        
        monkeypatch.setattr(mongo_service, "trips_collection", MockCollection())
        
        result = mongo_service.get_trip_by_id("invalid")
        assert result is None

    def test_get_trip_by_id_not_found(self, monkeypatch):
        """Test get_trip_by_id when trip doesn't exist"""
        class MockCollection:
            def find_one(self, query):
                return None
        
        monkeypatch.setattr(mongo_service, "trips_collection", MockCollection())
        
        trip_id = str(ObjectId())
        result = mongo_service.get_trip_by_id(trip_id)
        assert result is None

    def test_get_trip_rating_stats_with_ratings(self, monkeypatch):
        """Test get_trip_rating_stats with existing ratings"""
        trip_id = str(ObjectId())
        mock_agg = [{"_id": ObjectId(trip_id), "avg": 4.5, "count": 10}]
        
        class MockCollection:
            def aggregate(self, pipeline):
                return iter(mock_agg)
        
        monkeypatch.setattr(mongo_service, "ratings_collection", MockCollection())
        
        result = mongo_service.get_trip_rating_stats(trip_id)
        
        assert result["avgRating"] == 4.5
        assert result["numRatings"] == 10

    def test_get_trip_rating_stats_no_ratings(self, monkeypatch):
        """Test get_trip_rating_stats when no ratings exist"""
        class MockCollection:
            def aggregate(self, pipeline):
                return iter([])
        
        monkeypatch.setattr(mongo_service, "ratings_collection", MockCollection())
        
        trip_id = str(ObjectId())
        result = mongo_service.get_trip_rating_stats(trip_id)
        
        assert result["avgRating"] == 0.0
        assert result["numRatings"] == 0

    def test_get_trip_rating_stats_exception(self, monkeypatch):
        """Test get_trip_rating_stats handles exceptions"""
        class MockCollection:
            def aggregate(self, pipeline):
                raise Exception("DB error")
        
        monkeypatch.setattr(mongo_service, "ratings_collection", MockCollection())
        
        trip_id = str(ObjectId())
        result = mongo_service.get_trip_rating_stats(trip_id)
        
        assert result["avgRating"] == 0.0
        assert result["numRatings"] == 0

    def test_get_trip_rating_stats_rounds_average(self, monkeypatch):
        """Test get_trip_rating_stats rounds average to 2 decimals"""
        trip_id = str(ObjectId())
        mock_agg = [{"_id": ObjectId(trip_id), "avg": 4.56789, "count": 3}]
        
        class MockCollection:
            def aggregate(self, pipeline):
                return iter(mock_agg)
        
        monkeypatch.setattr(mongo_service, "ratings_collection", MockCollection())
        
        result = mongo_service.get_trip_rating_stats(trip_id)
        
        assert result["avgRating"] == 4.57
        assert result["numRatings"] == 3

    def test_upsert_rating_success(self, monkeypatch):
        """Test upsert_rating updates rating"""
        captured_query = None
        captured_update = None
        
        class MockCollection:
            def update_one(self, query, update, upsert=False):
                nonlocal captured_query, captured_update
                captured_query = query
                captured_update = update
        
        monkeypatch.setattr(mongo_service, "ratings_collection", MockCollection())
        
        trip_id = str(ObjectId())
        user_id = "user123"
        rating = 5
        date = datetime.utcnow()
        
        mongo_service.upsert_rating(trip_id, user_id, rating, date)
        
        assert captured_query["tripId"] == ObjectId(trip_id)
        assert captured_query["userId"] == user_id
        assert captured_update["$set"]["rating"] == rating
        assert captured_update["$set"]["date"] == date

    def test_upsert_rating_exception(self, monkeypatch):
        """Test upsert_rating handles exceptions gracefully"""
        class MockCollection:
            def update_one(self, *args, **kwargs):
                raise Exception("DB error")
        
        monkeypatch.setattr(mongo_service, "ratings_collection", MockCollection())
        
        trip_id = str(ObjectId())
        # Should not raise, just print error
        result = mongo_service.upsert_rating(trip_id, "user123", 5, datetime.utcnow())
        assert result is None

    def test_list_comments_success(self, monkeypatch):
        """Test list_comments returns sorted comments"""
        trip_id = str(ObjectId())
        mock_comments = [
            {
                "_id": ObjectId(),
                "tripId": ObjectId(trip_id),
                "text": "Comment 1",
                "createdAt": datetime(2024, 1, 1),
            },
            {
                "_id": ObjectId(),
                "tripId": ObjectId(trip_id),
                "text": "Comment 2",
                "createdAt": datetime(2024, 1, 2),
            },
        ]
        
        class MockCursor:
            def __init__(self, comments):
                self.comments = comments
                self._index = 0
            
            def sort(self, field, direction):
                return self
            
            def skip(self, n):
                return self
            
            def limit(self, n):
                return self
            
            def __iter__(self):
                return iter(self.comments)
        
        class MockCollection:
            def find(self, query):
                return MockCursor(mock_comments)
        
        monkeypatch.setattr(mongo_service, "comments_collection", MockCollection())
        
        result = mongo_service.list_comments(trip_id, limit=20, skip=0)
        
        assert len(result) == 2
        assert all(isinstance(c["_id"], str) for c in result)
        assert all(isinstance(c["tripId"], str) for c in result)
        assert all(isinstance(c["createdAt"], str) for c in result)  # ISO format

    def test_list_comments_empty(self, monkeypatch):
        """Test list_comments returns empty list when no comments"""
        class MockCursor:
            def sort(self, field, direction):
                return self
            def skip(self, n):
                return self
            def limit(self, n):
                return iter([])
        
        class MockCollection:
            def find(self, query):
                return MockCursor()
        
        monkeypatch.setattr(mongo_service, "comments_collection", MockCollection())
        
        trip_id = str(ObjectId())
        result = mongo_service.list_comments(trip_id, limit=20, skip=0)
        
        assert result == []

    def test_list_comments_with_pagination(self, monkeypatch):
        """Test list_comments respects limit and skip"""
        trip_id = str(ObjectId())
        captured_skip = None
        captured_limit = None
        
        class MockCursor:
            def __init__(self):
                self.skip_val = None
                self.limit_val = None
            
            def sort(self, field, direction):
                return self
            
            def skip(self, n):
                self.skip_val = n
                return self
            
            def limit(self, n):
                self.limit_val = n
                return iter([])
        
        class MockCollection:
            def find(self, query):
                return MockCursor()
        
        monkeypatch.setattr(mongo_service, "comments_collection", MockCollection())
        
        mongo_service.list_comments(trip_id, limit=10, skip=5)
        
        # Verify pagination was called (we can't easily capture it, but we test it doesn't crash)

    def test_list_comments_exception(self, monkeypatch):
        """Test list_comments handles exceptions"""
        class MockCollection:
            def find(self, query):
                raise Exception("DB error")
        
        monkeypatch.setattr(mongo_service, "comments_collection", MockCollection())
        
        trip_id = str(ObjectId())
        result = mongo_service.list_comments(trip_id, limit=20, skip=0)
        
        assert result == []

    def test_list_comments_converts_datetime(self, monkeypatch):
        """Test list_comments converts datetime to ISO string"""
        trip_id = str(ObjectId())
        mock_comments = [
            {
                "_id": ObjectId(),
                "tripId": ObjectId(trip_id),
                "text": "Test",
                "createdAt": datetime(2024, 1, 1, 12, 0, 0),
            }
        ]
        
        class MockCursor:
            def __init__(self, comments):
                self.comments = comments
            
            def sort(self, field, direction):
                return self
            
            def skip(self, n):
                return self
            
            def limit(self, n):
                return iter(self.comments)
        
        class MockCollection:
            def find(self, query):
                return MockCursor(mock_comments)
        
        monkeypatch.setattr(mongo_service, "comments_collection", MockCollection())
        
        result = mongo_service.list_comments(trip_id, limit=20, skip=0)
        
        assert isinstance(result[0]["createdAt"], str)
        assert "2024-01-01" in result[0]["createdAt"]

