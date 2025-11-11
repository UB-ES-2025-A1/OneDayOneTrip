from pydantic import BaseModel, Field
from datetime import datetime, UTC


class RatingModel(BaseModel):
    userId: str
    rating: int = Field(ge=1, le=5)
    date: datetime = datetime.now(UTC)
