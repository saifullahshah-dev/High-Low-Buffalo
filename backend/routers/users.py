from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import db
from bson import ObjectId
import schemas, deps

router = APIRouter()

@router.post("/friends", response_model=schemas.User, response_model_by_alias=False)
async def add_friend(
    friend_request: schemas.FriendAddRequest,
    current_user: schemas.User = Depends(deps.get_current_user)
):
    # Search for user by email
    friend = await db.users.find_one({"email": friend_request.email})
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    friend_id = str(friend["_id"])
    
    if friend_id == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a friend"
        )

    # Add to friends list if not already there
    # Note: We rely on $addToSet to handle uniqueness
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$addToSet": {"settings.friends": friend_id}}
    )
    
    # Return basic info about the friend
    return schemas.User(**friend)

@router.get("/friends", response_model=List[schemas.User], response_model_by_alias=False)
async def get_friends(
    current_user: schemas.User = Depends(deps.get_current_user)
):
    if not current_user.settings or not current_user.settings.friends:
        return []

    try:
        friend_ids = [ObjectId(fid) for fid in current_user.settings.friends]
        friends = await db.users.find({"_id": {"$in": friend_ids}}).to_list(1000)
        return [schemas.User(**f) for f in friends]
    except Exception as e:
        print(f"Error fetching friends: {e}")
        return []

@router.delete("/friends/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    friend_id: str,
    current_user: schemas.User = Depends(deps.get_current_user)
):
    """
    Remove a friend from the current user's friend list.
    """
    if not current_user.settings or not current_user.settings.friends:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend list is empty"
        )

    # Check if friend exists in the list
    if friend_id not in current_user.settings.friends:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend not found in your list"
        )

    # Remove from friends list
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$pull": {"settings.friends": friend_id}}
    )
    
    return None

@router.get("/me", response_model=schemas.User, response_model_by_alias=False)
async def read_users_me(current_user: schemas.User = Depends(deps.get_current_user)):
    return current_user

@router.put("/me/settings", response_model=schemas.User, response_model_by_alias=False)
async def update_user_settings(settings: schemas.UserSettings, current_user: schemas.User = Depends(deps.get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"settings": settings.model_dump()}}
    )
    current_user.settings = settings
    return current_user