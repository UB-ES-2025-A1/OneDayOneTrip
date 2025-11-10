from pydantic import BaseModel
from typing import List, Optional

class Coordinates(BaseModel):
    lat: float
    lng: float

class TripPointIn(BaseModel):
    title: str
    description: Optional[str] = None
    coordinates: Optional[Coordinates] = None

class AuthorIn(BaseModel):
    userId: str
    name: str
    profilePic: Optional[str] = None  # esta sí es URL

class TripCreateIn(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    author: AuthorIn
    city: str
    region: Optional[str] = None
    country: Optional[str] = "España"
    routeMap: List[dict] = []
    trip_points: List[TripPointIn] = []
    distance: Optional[float] = None
    duration: Optional[str] = None
    difficulty: Optional[str] = "Media"
    recommendedSeason: Optional[str] = "Primavera"
