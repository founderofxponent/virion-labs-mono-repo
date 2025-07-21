from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    email_confirmed: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class EmailConfirmation(BaseModel):
    token: str