from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

class AccessRequest(BaseModel):
    id: UUID
    discord_user_id: str
    discord_username: str
    discord_guild_id: str
    full_name: str
    email: EmailStr
    verified_role_id: str
    status: Optional[str] = 'pending'
    role_assigned_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AccessRequestUpdate(BaseModel):
    request_id: UUID
    action: Literal["approve", "deny"] 