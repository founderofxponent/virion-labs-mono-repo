from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CampaignOnboardingResponseBase(BaseModel):
    campaign_id: UUID
    discord_user_id: str
    discord_username: Optional[str] = None
    field_key: str
    field_value: Optional[str] = None
    referral_id: Optional[UUID] = None
    referral_link_id: Optional[UUID] = None
    interaction_id: Optional[UUID] = None
    is_completed: Optional[bool] = None

class CampaignOnboardingResponseCreate(CampaignOnboardingResponseBase):
    pass

class CampaignOnboardingResponseUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    field_key: Optional[str] = None
    field_value: Optional[str] = None
    referral_id: Optional[UUID] = None
    referral_link_id: Optional[UUID] = None
    interaction_id: Optional[UUID] = None
    is_completed: Optional[bool] = None

class CampaignOnboardingResponse(CampaignOnboardingResponseBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
