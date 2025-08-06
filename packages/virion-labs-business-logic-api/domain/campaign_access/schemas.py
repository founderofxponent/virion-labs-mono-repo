from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any
from datetime import datetime

class CampaignInfluencerAccessBase(BaseModel):
    request_message: Optional[str] = None
    admin_response: Optional[str] = None
    is_active: Optional[bool] = True

class CampaignInfluencerAccessCreate(CampaignInfluencerAccessBase):
    campaign_id: int
    user_id: int
    request_status: Optional[Literal['pending', 'approved', 'denied']] = 'pending'
    requested_at: Optional[str] = None  # Changed to string for ISO format

class CampaignInfluencerAccessUpdate(CampaignInfluencerAccessBase):
    request_status: Optional[Literal['pending', 'approved', 'denied']] = None
    access_granted_at: Optional[str] = None  # Changed to string for ISO format
    reviewed_at: Optional[str] = None  # Changed to string for ISO format

class CampaignInfluencerAccessResponse(CampaignInfluencerAccessBase):
    id: int
    documentId: Optional[str] = None
    campaign_id: int
    user_id: int
    request_status: str
    requested_at: Optional[datetime] = None
    access_granted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    campaign: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }