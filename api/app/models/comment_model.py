from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CommentModel(BaseModel):
    tripId: str
    userId: str
    userName: str
    userProfilePicture: Optional[str] = None
    text: str
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
