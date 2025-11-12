# test_root_and_models.py
from pydantic import ValidationError
import pytest
from app.models.trip_create_in import TripCreateIn
from app.models.rating_model import RatingModel

def test_tripcreatein_min_fields():
    payload = {
        "title": "Ruta Benasque",
        "author": {"userId": "u1", "name": "Jesús"},
        "city": "Benasque",
    }
    obj = TripCreateIn(**payload)
    assert obj.title == "Ruta Benasque"
    assert obj.country == "España"

def test_ratingmodel_bounds():
    RatingModel(userId="u1", rating=5)  # ok
    with pytest.raises(ValidationError):
        RatingModel(userId="u1", rating=0)
