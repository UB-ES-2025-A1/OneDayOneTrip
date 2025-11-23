from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CommentModel(BaseModel):
    tripId: str
    userId: str
    userProfilePicture: str
    userName: str   # <-- corregido
    text: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

