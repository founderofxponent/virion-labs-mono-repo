from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class Campaign(CampaignBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignAccessRequest(BaseModel):
    reason: Optional[str] = None
    additional_info: Optional[str] = None

class ReferralLinkBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class ReferralLinkCreate(ReferralLinkBase):
    pass

class ReferralLink(ReferralLinkBase):
    id: UUID
    campaign_id: UUID
    code: str
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True