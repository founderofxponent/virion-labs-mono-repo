from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class AccessRequestBase(BaseModel):
    discord_user_id: str
    discord_username: str
    discord_guild_id: str
    full_name: str
    email: EmailStr
    verified_role_id: str
    role_assigned_at: str
    status: str

class AccessRequestCreate(AccessRequestBase):
    pass

class AccessRequestUpdate(BaseModel):
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    discord_guild_id: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    verified_role_id: Optional[str] = None
    role_assigned_at: Optional[str] = None
    status: Optional[str] = None

class AccessRequest(AccessRequestBase):
    id: UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
