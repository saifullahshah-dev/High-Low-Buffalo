from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from schemas import Herd, HerdCreate, HerdUpdate, HerdMember, User, FriendAddRequest
from deps import get_current_user
from database import db

router = APIRouter()

@router.post("/", response_model=Herd, status_code=status.HTTP_201_CREATED, response_model_by_alias=False)
async def create_herd(
    herd: HerdCreate,
    current_user: User = Depends(get_current_user)
):
    herd_data = herd.model_dump()
    user_id = str(current_user.id)
    
    # Create initial member (the owner)
    owner_member = HerdMember(
        user_id=user_id,
        email=current_user.email,
        joined_at=datetime.now(timezone.utc),
        role="owner"
    )

    now = datetime.now(timezone.utc).isoformat()
    
    new_herd = {
        **herd_data,
        "owner_id": user_id,
        "members": [owner_member.model_dump()],
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.herds.insert_one(new_herd)
    created_herd = await db.herds.find_one({"_id": result.inserted_id})
    return created_herd

@router.get("/", response_model=List[Herd], response_model_by_alias=False)
async def list_herds(
    current_user: User = Depends(get_current_user)
):
    # Find herds where the user is in the members list
    # We query 'members.user_id' inside the array of objects
    herds = await db.herds.find(
        {"members.user_id": str(current_user.id)}
    ).to_list(100)
    return herds

@router.get("/{id}", response_model=Herd, response_model_by_alias=False)
async def get_herd(
    id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    herd = await db.herds.find_one({"_id": obj_id})
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")

    # Check if user is a member
    is_member = any(m["user_id"] == str(current_user.id) for m in herd.get("members", []))
    if not is_member:
        raise HTTPException(status_code=403, detail="Not authorized to access this herd")

    return herd

@router.put("/{id}", response_model=Herd, response_model_by_alias=False)
async def update_herd(
    id: str,
    herd_update: HerdUpdate,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    herd = await db.herds.find_one({"_id": obj_id})
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")

    # Only owner can update details
    if herd.get("owner_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the owner can update the herd")

    update_data = herd_update.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.herds.update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )

    updated_herd = await db.herds.find_one({"_id": obj_id})
    return updated_herd

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_herd(
    id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    herd = await db.herds.find_one({"_id": obj_id})
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")

    # Only owner can delete
    if herd.get("owner_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the owner can delete the herd")

    await db.herds.delete_one({"_id": obj_id})
    return None

@router.post("/{id}/members", response_model=Herd, response_model_by_alias=False)
async def add_member(
    id: str,
    member_request: FriendAddRequest, # Reusing schema: { "email": "..." }
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    herd = await db.herds.find_one({"_id": obj_id})
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")

    # Check permissions - assume only owner can add for now
    if herd.get("owner_id") != str(current_user.id):
        raise HTTPException(status_code=403, detail="Only the owner can add members")

    # Verify user exists
    user_to_add = await db.users.find_one({"email": member_request.email})
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User with this email not found")

    user_to_add_id = str(user_to_add["_id"])

    # Check if already a member
    if any(m["user_id"] == user_to_add_id for m in herd.get("members", [])):
        raise HTTPException(status_code=400, detail="User is already a member of this herd")

    new_member = HerdMember(
        user_id=user_to_add_id,
        email=user_to_add["email"],
        joined_at=datetime.now(timezone.utc),
        role="member"
    )

    await db.herds.update_one(
        {"_id": obj_id},
        {"$push": {"members": new_member.model_dump()}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return await db.herds.find_one({"_id": obj_id})

@router.delete("/{id}/members/{user_id}", response_model=Herd, response_model_by_alias=False)
async def remove_member(
    id: str,
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    herd = await db.herds.find_one({"_id": obj_id})
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")

    current_user_id = str(current_user.id)
    
    # Check permissions
    # 1. Owner can remove anyone
    # 2. User can remove themselves (leave)
    is_owner = herd.get("owner_id") == current_user_id
    is_self = user_id == current_user_id

    if not (is_owner or is_self):
        raise HTTPException(status_code=403, detail="Not authorized to remove this member")

    # Cannot remove the owner (owner must delete herd or transfer ownership - transfer not implemented yet)
    if user_id == herd.get("owner_id"):
        raise HTTPException(status_code=400, detail="Owner cannot be removed. Delete the herd instead.")

    # Check if member exists
    if not any(m["user_id"] == user_id for m in herd.get("members", [])):
        raise HTTPException(status_code=404, detail="Member not found in herd")

    await db.herds.update_one(
        {"_id": obj_id},
        {"$pull": {"members": {"user_id": user_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    return await db.herds.find_one({"_id": obj_id})