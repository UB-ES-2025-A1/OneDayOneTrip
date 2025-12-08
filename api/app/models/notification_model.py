from pydantic import BaseModel
from typing import Optional, Dict


class NotificationCreate(BaseModel):
    fromUserId: str
    toUserId: str
    type: str                 # "follow", "comment", "rating", "follow_request"
    message: str
    extra: Optional[Dict] = None
