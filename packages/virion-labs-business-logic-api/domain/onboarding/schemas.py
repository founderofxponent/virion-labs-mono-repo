from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

# --- Campaign Onboarding Start ---

class CampaignOnboardingStartBase(BaseModel):
    """Base model for the start of a campaign onboarding process."""
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None

class CampaignOnboardingStartCreate(CampaignOnboardingStartBase):
    """Model for creating a new onboarding start event."""
    campaign: int # Expects the numeric ID of the campaign

class CampaignOnboardingStartResponse(CampaignOnboardingStartBase):
    """Model for an onboarding start event response."""
    id: int
    started_at: datetime

# --- Campaign Onboarding Completion ---

class CampaignOnboardingCompletionBase(BaseModel):
    """Base model for the completion of a campaign onboarding process."""
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None

class CampaignOnboardingCompletionCreate(CampaignOnboardingCompletionBase):
    """Model for creating a new onboarding completion event."""
    campaign: int # Expects the numeric ID of the campaign

class CampaignOnboardingCompletionResponse(CampaignOnboardingCompletionBase):
    """Model for an onboarding completion event response."""
    id: int
    completed_at: datetime

# --- Campaign Onboarding Response ---

class CampaignOnboardingResponseBase(BaseModel):
    """Base model for a response to a campaign onboarding field."""
    discord_user_id: str
    discord_username: Optional[str] = None
    field_key: str
    field_value: Optional[str] = None
    interaction_id: Optional[str] = None

class CampaignOnboardingResponseCreate(CampaignOnboardingResponseBase):
    """Model for creating a new onboarding response."""
    campaign: int # Expects the numeric ID of the campaign
    referral_link: Optional[int] = None # Expects the numeric ID of the referral link

class CampaignOnboardingResponse(CampaignOnboardingResponseBase):
    """Full model for an onboarding response, as returned from Strapi."""
    id: int
    documentId: str