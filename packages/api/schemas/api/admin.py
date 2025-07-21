from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Literal, Optional, List
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

class AdminUserProfile(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    email_confirmed: bool = False
    created_at: datetime
    updated_at: datetime
    
    # Additional admin-specific fields
    access_requests: Optional[List[AccessRequest]] = None
    total_campaigns: Optional[int] = 0
    last_activity: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AdminUserListResponse(BaseModel):
    success: bool
    message: str
    users: List[AdminUserProfile]
    total_count: int 