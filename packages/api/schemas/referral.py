from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class ReferralValidation(BaseModel):
    is_valid: bool
    code: str
    campaign_id: Optional[UUID] = None
    campaign_name: Optional[str] = None

class ReferralCampaignInfo(BaseModel):
    campaign_id: UUID
    campaign_name: str
    campaign_description: Optional[str] = None
    referral_link_name: str
    referral_link_description: Optional[str] = None

class ReferralSignup(BaseModel):
    referral_code: str
    email: EmailStr
    full_name: str
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    additional_data: Optional[dict] = None

class ReferralComplete(BaseModel):
    referral_code: str
    user_id: UUID
    conversion_data: Optional[dict] = None