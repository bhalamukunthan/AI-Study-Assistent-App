from datetime import datetime
from pydantic import BaseModel

class UserBase(BaseModel):
    name: str
    email: str
    avatar: str | None = None

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    avatar: str | None = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

