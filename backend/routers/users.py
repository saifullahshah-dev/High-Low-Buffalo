from fastapi import APIRouter, Depends
from ..models import User
from ..deps import get_current_active_user

router = APIRouter()

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user