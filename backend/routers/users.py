from fastapi import APIRouter, Depends
from database import db
from bson import ObjectId
import schemas, deps

router = APIRouter()

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(deps.get_current_user)):
    return current_user

@router.put("/me/settings", response_model=schemas.User)
async def update_user_settings(settings: schemas.UserSettings, current_user: schemas.User = Depends(deps.get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"settings": settings.model_dump()}}
    )
    current_user.settings = settings
    return current_user