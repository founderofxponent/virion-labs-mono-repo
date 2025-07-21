from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class DiscordActivitieBase(BaseModel):
    client_id: UUID
    activity_name: str
    activity_type: str
    activity_config: dict
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    activity_url: Optional[str] = None
    custom_assets: Optional[dict] = None
    client_branding: Optional[dict] = None
    persistent_data: Optional[dict] = None
    user_data: Optional[dict] = None
    usage_stats: Optional[dict] = None
    last_used_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class DiscordActivitieCreate(DiscordActivitieBase):
    pass

class DiscordActivitieUpdate(BaseModel):
    client_id: Optional[UUID] = None
    activity_name: Optional[str] = None
    activity_type: Optional[str] = None
    activity_config: Optional[dict] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    activity_url: Optional[str] = None
    custom_assets: Optional[dict] = None
    client_branding: Optional[dict] = None
    persistent_data: Optional[dict] = None
    user_data: Optional[dict] = None
    usage_stats: Optional[dict] = None
    last_used_at: Optional[datetime] = None
    is_active: Optional[bool] = None

class DiscordActivitie(DiscordActivitieBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
