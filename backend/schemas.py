from pydantic import BaseModel, EmailStr, Field, BeforeValidator, field_validator
from typing import Optional, Annotated, Any, List
from datetime import datetime
from bson import ObjectId

PyObjectId = Annotated[str, BeforeValidator(str)]

class HerdMember(BaseModel):
    user_id: str
    email: EmailStr
    joined_at: datetime
    role: str = "member"

class HerdBase(BaseModel):
    name: str
    description: Optional[str] = None

class HerdCreate(HerdBase):
    pass

class HerdUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    members: Optional[List[HerdMember]] = None

class Herd(HerdBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    owner_id: str
    members: List[HerdMember] = []
    created_at: str
    updated_at: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserSettings(BaseModel):
    notificationCadence: str = "daily"
    herds: list[str] = []
    friends: list[str] = []

    @field_validator('herds', mode='before')
    @classmethod
    def validate_herds(cls, v: Any) -> list[str]:
        if not isinstance(v, list):
            return []
        # Filter out non-string items (legacy dicts) to prevent validation errors
        return [item for item in v if isinstance(item, str)]

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    settings: Optional[UserSettings] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    is_active: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class FriendAddRequest(BaseModel):
    email: EmailStr

class ReactionRequest(BaseModel):
    type: str = "curious"

class ReflectionBase(BaseModel):
    high: str
    low: str
    buffalo: str
    sharedWith: list[str] = []
    sharedHerds: list[str] = []
    image: Optional[str] = None
    # Dictionary mapping ReactionType -> List of UserIDs
    curiosityReactions: dict[str, list[str]] = {}
    isFlaggedForFollowUp: Optional[bool] = False

class ReflectionCreate(ReflectionBase):
    pass

class ReflectionUpdate(BaseModel):
    high: Optional[str] = None
    low: Optional[str] = None
    buffalo: Optional[str] = None
    sharedWith: Optional[list[str]] = None
    sharedHerds: Optional[list[str]] = None
    image: Optional[str] = None
    curiosityReactions: Optional[dict[str, list[str]]] = None
    isFlaggedForFollowUp: Optional[bool] = None

class Reflection(ReflectionBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    timestamp: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ReflectionFeedItem(Reflection):
    author_name: str