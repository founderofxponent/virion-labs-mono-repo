from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CampaignInfluencerAccessBase(BaseModel):
    campaign_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    access_granted_at: Optional[datetime] = None
    access_granted_by: Optional[UUID] = None
    is_active: Optional[bool] = None
    request_status: Optional[str] = None
    requested_at: Optional[datetime] = None
    request_message: Optional[str] = None
    admin_response: Optional[str] = None

class CampaignInfluencerAccessCreate(CampaignInfluencerAccessBase):
    pass

class CampaignInfluencerAccessUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    access_granted_at: Optional[datetime] = None
    access_granted_by: Optional[UUID] = None
    is_active: Optional[bool] = None
    request_status: Optional[str] = None
    requested_at: Optional[datetime] = None
    request_message: Optional[str] = None
    admin_response: Optional[str] = None

class CampaignInfluencerAccess(CampaignInfluencerAccessBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
