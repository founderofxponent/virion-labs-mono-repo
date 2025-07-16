from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class BotCampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    discord_guild_id: str
    discord_channel_id: Optional[str] = None
    is_active: bool = True
    onboarding_config: Optional[Dict[str, Any]] = None
    landing_page_config: Optional[Dict[str, Any]] = None

class BotCampaign(BotCampaignBase):
    id: UUID
    created_by: UUID
    view_count: int = 0
    join_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BotCampaignCreate(BotCampaignBase):
    pass

class BotCampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discord_guild_id: Optional[str] = None
    discord_channel_id: Optional[str] = None
    is_active: Optional[bool] = None
    onboarding_config: Optional[Dict[str, Any]] = None
    landing_page_config: Optional[Dict[str, Any]] = None

class CampaignStats(BaseModel):
    view_count: Optional[int] = None
    join_count: Optional[int] = None
    additional_stats: Optional[Dict[str, Any]] = None