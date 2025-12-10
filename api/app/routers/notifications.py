from fastapi import APIRouter, HTTPException
from app.models.notification_model import NotificationCreate
from app.services.mongo_service import (
    create_notification,
    list_notifications,
    mark_notification_as_read,
    delete_notification,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/{user_id}")
def get_notifications(user_id: str, unread: bool = False):
    return list_notifications(user_id, only_unread=unread)


@router.post("/")
def add_notification(payload: NotificationCreate):
    notif_id = create_notification(
        from_user_id=payload.fromUserId,
        to_user_id=payload.toUserId,
        type=payload.type,
        message=payload.message,
        extra=payload.extra,
    )
    return {"id": notif_id}


@router.put("/read/{notification_id}")
def mark_as_read(notification_id: str):
    ok = mark_notification_as_read(notification_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "ok"}


@router.delete("/{notification_id}")
def delete_notif(notification_id: str):
    ok = delete_notification(notification_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "deleted"}
