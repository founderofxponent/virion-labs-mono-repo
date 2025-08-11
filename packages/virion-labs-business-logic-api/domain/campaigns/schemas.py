from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict, Literal
from datetime import datetime

# --- Campaign Schemas ---

class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    campaign_type: Optional[Literal['referral_onboarding', 'community_engagement', 'product_promotion', 'custom', 'vip_support']] = None
    is_active: Optional[bool] = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    guild_id: str
    channel_id: Optional[str] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    bot_name: Optional[str] = 'Virion Bot'
    bot_avatar_url: Optional[str] = None
    brand_color: Optional[str] = '#6366f1'
    brand_logo_url: Optional[str] = None
    total_interactions: Optional[int] = 0
    successful_onboardings: Optional[int] = 0
    referral_conversions: Optional[int] = 0
    metadata: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None
    bot_personality: Optional[str] = 'helpful'
    bot_response_style: Optional[str] = 'friendly'
    auto_role_assignment: Optional[bool] = False
    target_role_ids: Optional[List[str]] = Field(default_factory=list)
    referral_tracking_enabled: Optional[bool] = True
    moderation_enabled: Optional[bool] = True
    rate_limit_per_user: Optional[int] = 5
    auto_responses: Optional[Dict[str, Any]] = None
    custom_commands: Optional[Dict[str, Any]] = None
    total_investment: Optional[float] = 0
    value_per_conversion: Optional[float] = 0
    client: Optional[Any] = None

class CampaignCreate(CampaignBase):
    client: Any # Can be documentId string or ID int

class CampaignUpdate(CampaignBase):
    name: Optional[str] = None # All fields are optional for update
    guild_id: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: int
    documentId: str

# --- Campaign Landing Page Schemas ---

class CampaignLandingPageBase(BaseModel):
    offer_title: Optional[str] = None
    offer_description: Optional[str] = None
    offer_highlights: Optional[List[Any]] = None
    offer_value: Optional[str] = None
    offer_expiry_date: Optional[str] = None
    hero_image_url: Optional[Any] = None
    product_images: Optional[List[Any]] = None
    video_url: Optional[str] = None
    what_you_get: Optional[str] = None
    how_it_works: Optional[str] = None
    requirements: Optional[str] = None
    support_info: Optional[str] = None
    inherited_from_template: Optional[bool] = None
    landing_page_template: Optional[Any] = None
    campaign: Optional[Any] = None

class CampaignLandingPageCreate(CampaignLandingPageBase):
    campaign: Any # Can be documentId string or ID int

class CampaignLandingPageUpdate(CampaignLandingPageBase):
    pass

# --- Campaign Onboarding Field Schemas ---

class CampaignOnboardingFieldBase(BaseModel):
    field_key: Optional[str] = None
    field_label: Optional[str] = None
    field_type: Optional[Literal['text', 'email', 'number', 'boolean', 'url', 'select', 'multiselect']] = None
    field_placeholder: Optional[str] = None
    field_description: Optional[str] = None
    field_options: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    is_enabled: Optional[bool] = None
    sort_order: Optional[int] = None
    validation_rules: Optional[Dict[str, Any]] = None
    discord_integration: Optional[Dict[str, Any]] = None

class CampaignOnboardingFieldCreate(CampaignOnboardingFieldBase):
    field_key: str
    field_label: str
    field_type: str
    campaign: Any # Can be documentId string or ID int

class CampaignOnboardingFieldUpdate(CampaignOnboardingFieldBase):
    pass