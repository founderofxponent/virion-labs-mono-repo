from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReferralLinkBase(BaseModel):
    """Base model for a referral link, matching dashboard and Strapi structure."""
    title: str
    description: Optional[str] = None
    platform: str
    original_url: str
    is_active: Optional[bool] = True
    expires_at: Optional[datetime] = None
    discord_invite_url: Optional[str] = None
    redirect_to_discord: Optional[bool] = False
    landing_page_enabled: Optional[bool] = True
    metadata: Optional[Dict[str, Any]] = None

class ReferralLinkCreate(ReferralLinkBase):
    """Model for creating a new referral link."""
    campaign: int # Expects a numeric ID
    influencer: int # Expects a numeric ID

class ReferralLinkUpdate(BaseModel):
    """Model for updating a referral link. All fields are optional."""
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class ReferralLinkResponse(ReferralLinkBase):
    """Full referral link model for API responses."""
    id: int
    documentId: str
    referral_code: str
    referral_url: str
    clicks: Optional[int] = 0
    conversions: Optional[int] = 0
    conversion_rate: Optional[float] = 0.0
    earnings: Optional[float] = 0.0

class Referral(BaseModel):
    """Model representing a referred user, as used by the dashboard."""
    id: int
    documentId: str
    name: str
    email: str
    status: str
    source_platform: Optional[str] = None
    created_at: datetime
    conversion_value: Optional[float] = 0.0
    referral_link: Optional[ReferralLinkResponse] = None