from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from domain.influencers.schemas import ReferralLinkResponse as DomainReferralLinkResponse, Referral as DomainReferral

class ReferralLinkCreateRequest(BaseModel):
    """API model for creating a new referral link."""
    title: str = Field(..., description="The title of the referral link.")
    platform: str = Field(..., description="The platform for the link (e.g., 'discord', 'website').")
    original_url: str = Field(..., description="The original URL to redirect to.")
    campaign: int = Field(..., description="The numeric ID of the campaign.")
    description: Optional[str] = Field(None, description="A description of the referral link.")

class ReferralLinkUpdateRequest(BaseModel):
    """API model for updating a referral link. All fields are optional."""
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ReferralLinkResponse(DomainReferralLinkResponse):
    """API response model for a single referral link."""
    pass

class ReferralLinkListResponse(BaseModel):
    """API response model for a list of referral links."""
    links: List[ReferralLinkResponse]
    total_count: int

class ReferralResponse(DomainReferral):
    """API response model for a single referral."""
    pass

class ReferralListResponse(BaseModel):
    """API response model for a list of referrals."""
    referrals: List[ReferralResponse]
    total_count: int