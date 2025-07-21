from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CampaignOnboardingStartBase(BaseModel):
    campaign_id: UUID
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    started_at: Optional[datetime] = None

class CampaignOnboardingStartCreate(CampaignOnboardingStartBase):
    pass

class CampaignOnboardingStartUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    guild_id: Optional[str] = None
    started_at: Optional[datetime] = None

class CampaignOnboardingStart(CampaignOnboardingStartBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
