from fastapi import APIRouter, status, Depends
from datetime import datetime, timedelta, timezone
from database import db
from deps import get_current_user
from schemas import User
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/status", status_code=status.HTTP_200_OK)
async def get_notification_status(current_user: User = Depends(get_current_user)):
    """
    Checks if the current authenticated user needs a reflection reminder.
    """
    # 1. Get user settings
    settings = current_user.settings
    cadence = "daily" # Default
    
    if settings and settings.notificationCadence:
        cadence = settings.notificationCadence
    
    # 2. Check cadence
    if cadence == "paused":
        return {"reminder_needed": False, "message": "Notifications are paused."}

    now = datetime.now(timezone.utc)
    user_id = str(current_user.id)
    
    should_notify = False
    message = ""

    # 3. Check reflections based on cadence
    if cadence == "daily":
        # Check if user has reflected today (since midnight UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_iso = today_start.isoformat()
        
        count = await db.reflections.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": today_iso}
        })
        
        if count == 0:
            should_notify = True
            message = "You haven't recorded your High, Low, and Buffalo today. Take a moment to reflect!"
            
    elif cadence == "weekly":
        # Check if user has reflected in the last 7 days
        seven_days_ago = now - timedelta(days=7)
        seven_days_ago_iso = seven_days_ago.isoformat()
        
        count = await db.reflections.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": seven_days_ago_iso}
        })
        
        if count == 0:
            should_notify = True
            message = "It's been a week since your last reflection. Time to check in!"

    return {"reminder_needed": should_notify, "message": message}