from pydantic import BaseModel
from typing import Optional

class DiscordSettingBase(BaseModel):
    """Base schema for Discord settings."""
    verified_role_id: Optional[str] = None

class DiscordSettingCreate(DiscordSettingBase):
    """Schema for creating Discord settings."""
    pass

class DiscordSettingUpdate(DiscordSettingBase):
    """Schema for updating Discord settings."""
    pass

class DiscordSettingResponse(DiscordSettingBase):
    """Schema for Discord settings API response."""
    id: Optional[int] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    publishedAt: Optional[str] = None