from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from schemas import Reflection, ReflectionCreate, ReflectionUpdate, User, ReflectionFeedItem, ReactionRequest
from deps import get_current_user
from database import db

router = APIRouter()

@router.get("/feed", response_model=List[ReflectionFeedItem], response_model_by_alias=False)
async def read_reflection_feed(
    current_user: User = Depends(get_current_user)
):
    pipeline = [
        # Match reflections shared with the current user
        {
            "$match": {
                "sharedWith": str(current_user.id)
            }
        },
        # Sort by timestamp descending
        {
            "$sort": {"timestamp": -1}
        },
        # Convert user_id string to ObjectId for lookup
        {
            "$addFields": {
                "userObjectId": {"$toObjectId": "$user_id"}
            }
        },
        # Lookup author details
        {
            "$lookup": {
                "from": "users",
                "localField": "userObjectId",
                "foreignField": "_id",
                "as": "author_info"
            }
        },
        # Unwind the author info array (since lookup returns an array)
        {
            "$unwind": "$author_info"
        },
        # Add author_name field
        {
            "$addFields": {
                "author_name": {
                    "$ifNull": ["$author_info.full_name", "$author_info.email"]
                }
            }
        },
        # Cleanup temporary fields
        {
            "$project": {
                "userObjectId": 0,
                "author_info": 0
            }
        }
    ]
    
    reflections = await db.reflections.aggregate(pipeline).to_list(100)
    return reflections

@router.post("/{id}/react", response_model=Reflection, response_model_by_alias=False)
async def react_to_reflection(
    id: str,
    reaction: ReactionRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # 1. Find reflection
    reflection = await db.reflections.find_one({"_id": obj_id})
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    # 2. Check permissions (must be shared with user)
    # Note: Authors can also react to their own posts if they are in sharedWith list?
    # Or implicitly if they own it?
    # Architecture says: "Check if current_user.id is in sharedWith"
    # Let's assume author can also react if they want, but usually this is for friends.
    # We will enforce the sharedWith check strictly as per architecture.
    if str(current_user.id) not in reflection.get("sharedWith", []):
         # Allow author to react to their own reflection even if not explicitly shared with self?
         # It's safer to allow author access.
         if reflection.get("user_id") != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view this reflection")

    reaction_type = reaction.type
    user_id = str(current_user.id)
    
    # 3. Toggle Logic
    # Get current reactions for this type
    current_reactions = reflection.get("curiosityReactions", {}).get(reaction_type, [])
    
    if user_id in current_reactions:
        # Toggle OFF: Remove user_id
        await db.reflections.update_one(
            {"_id": obj_id},
            {"$pull": {f"curiosityReactions.{reaction_type}": user_id}}
        )
    else:
        # Toggle ON: Add user_id
        await db.reflections.update_one(
            {"_id": obj_id},
            {"$addToSet": {f"curiosityReactions.{reaction_type}": user_id}}
        )

    updated_reflection = await db.reflections.find_one({"_id": obj_id})
    return updated_reflection

@router.post("/{id}/flag", response_model=Reflection, response_model_by_alias=False)
async def flag_reflection(
    id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    # 1. Find reflection
    reflection = await db.reflections.find_one({"_id": obj_id})
    if not reflection:
        raise HTTPException(status_code=404, detail="Reflection not found")

    # 2. Check permissions (only author can flag their own reflection)
    if reflection.get("user_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to flag this reflection")

    # 3. Toggle Flag
    new_flag_status = not reflection.get("isFlaggedForFollowUp", False)
    
    await db.reflections.update_one(
        {"_id": obj_id},
        {"$set": {"isFlaggedForFollowUp": new_flag_status}}
    )

    updated_reflection = await db.reflections.find_one({"_id": obj_id})
    return updated_reflection

@router.get("/", response_model=List[Reflection], response_model_by_alias=False)
async def read_reflections(
    current_user: User = Depends(get_current_user)
):
    reflections = await db.reflections.find({"user_id": str(current_user.id)}).to_list(1000)
    return reflections

@router.post("/", response_model=Reflection, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
async def create_reflection(
    reflection: ReflectionCreate,
    current_user: User = Depends(get_current_user)
):
    reflection_data = reflection.model_dump()
    reflection_data["user_id"] = str(current_user.id)
    reflection_data["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    new_reflection = await db.reflections.insert_one(reflection_data)
    created_reflection = await db.reflections.find_one({"_id": new_reflection.inserted_id})
    return created_reflection

@router.put("/{id}", response_model=Reflection, response_model_by_alias=False)
async def update_reflection(
    id: str,
    reflection_update: ReflectionUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    reflection = await db.reflections.find_one({"_id": obj_id, "user_id": str(current_user.id)})
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")

    update_data = reflection_update.model_dump(exclude_unset=True)
    
    if update_data:
        await db.reflections.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
    
    updated_reflection = await db.reflections.find_one({"_id": obj_id})
    return updated_reflection

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reflection(
    id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    reflection = await db.reflections.find_one({"_id": obj_id, "user_id": str(current_user.id)})
    if reflection is None:
        raise HTTPException(status_code=404, detail="Reflection not found")

    await db.reflections.delete_one({"_id": obj_id})
    return None