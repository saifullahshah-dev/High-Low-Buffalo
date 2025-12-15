from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from schemas import Reflection, ReflectionCreate, ReflectionUpdate, User
from deps import get_current_user
from database import db

router = APIRouter()

@router.get("/", response_model=List[Reflection])
async def read_reflections(
    current_user: User = Depends(get_current_user)
):
    reflections = await db.reflections.find({"user_id": str(current_user.id)}).to_list(1000)
    return reflections

@router.post("/", response_model=Reflection, status_code=status.HTTP_201_CREATED)
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

@router.put("/{id}", response_model=Reflection)
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