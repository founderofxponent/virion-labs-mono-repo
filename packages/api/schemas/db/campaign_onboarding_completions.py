from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CampaignOnboardingCompletionBase(BaseModel):
    campaign_id: UUID
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    completed_at: Optional[datetime] = None

class CampaignOnboardingCompletionCreate(CampaignOnboardingCompletionBase):
    pass

class CampaignOnboardingCompletionUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    guild_id: Optional[str] = None
    completed_at: Optional[datetime] = None

class CampaignOnboardingCompletion(CampaignOnboardingCompletionBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
