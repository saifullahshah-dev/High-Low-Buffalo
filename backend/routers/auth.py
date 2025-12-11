from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from ..models import UserCreate, Token, User, UserInDB
from ..security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from ..database import get_database

router = APIRouter()

@router.post("/signup", response_model=User)
async def signup(user: UserCreate, db = Depends(get_database)):
    # Check if user already exists
    if await db["users"].find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        **user.model_dump(),
        hashed_password=hashed_password
    )
    
    new_user = await db["users"].insert_one(user_in_db.model_dump(by_alias=True, exclude={"id"}))
    created_user = await db["users"].find_one({"_id": new_user.inserted_id})
    
    return User(**created_user)

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db = Depends(get_database)
):
    user_doc = await db["users"].find_one({"email": form_data.username})
    if not user_doc:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = UserInDB(**user_doc)
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}