from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CommentModel(BaseModel):
    tripId: str
    userId: str
    username: Optional[str] = None
    text: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
