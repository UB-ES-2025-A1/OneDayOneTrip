from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TripPoint(BaseModel):
    title: str
    description: Optional[str] = None
    coordinates: Optional[dict] = None
    location_name: str
    image: Optional[str] = None


class Author(BaseModel):
    userId: str
    name: str
    profilePic: Optional[str] = None


class TripModel(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = []
    author: Author
    city: str
    region: Optional[str] = None
    country: Optional[str] = "España"
    routeMap: Optional[List[dict]] = []
    trip_points: Optional[List[TripPoint]] = []
    distance: Optional[float] = None
    duration: Optional[str] = None
    difficulty: Optional[str] = "Media"
    recommendedSeason: Optional[str] = "Primavera"
    coverImage: Optional[str] = None
    gallery: Optional[List[str]] = []
    avgRating: Optional[float] = 0.0
    numComments: Optional[int] = 0
    likes: Optional[int] = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
