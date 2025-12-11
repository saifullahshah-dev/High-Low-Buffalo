from fastapi import APIRouter, Depends
import schemas, deps

router = APIRouter()

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(deps.get_current_user)):
    return current_user