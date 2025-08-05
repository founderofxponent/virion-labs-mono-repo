from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Dict, Any, Union, Literal
from datetime import datetime
# --- Base Models ---

class BusinessContext(BaseModel):
    recommendation: str
    is_active: bool

# --- Client Operations ---

class ClientResponse(BaseModel):
    id: int
    documentId: Optional[str] = None
    name: str
    contact_email: Optional[EmailStr] = None
    industry: Optional[str] = None
    client_status: Optional[str] = None
    website: Optional[str] = None
    primary_contact: Optional[str] = None
    campaign_count: Optional[int] = 0
    business_context: Optional[BusinessContext] = None

class ClientListResponse(BaseModel):
    """Defines the structure for the response of the client list operation."""
    clients: List[ClientResponse]
    total_count: int

class ClientCreateRequest(BaseModel):
    name: str
    contact_email: EmailStr
    industry: Optional[str] = None
    website: Optional[str] = None
    primary_contact: Optional[str] = None

class ClientUpdateRequest(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    industry: Optional[str] = None
    client_status: Optional[str] = None
    website: Optional[str] = None
    primary_contact: Optional[str] = None

# --- Campaign Operations ---

class CampaignBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[Literal['referral_onboarding', 'community_engagement', 'product_promotion', 'custom', 'vip_support']] = None
    is_active: Optional[bool] = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    bot_name: Optional[str] = 'Virion Bot'
    bot_avatar_url: Optional[str] = None
    brand_color: Optional[str] = '#6366f1'
    brand_logo_url: Optional[str] = None
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

class CampaignCreateRequest(CampaignBase):
    name: str
    guild_id: str
    client: str # The documentId of the client

class CampaignUpdateRequest(CampaignBase):
    pass # All fields are optional

class CampaignResponse(CampaignBase):
    id: int
    documentId: str
    name: str
    guild_id: str
    client: Optional[ClientResponse] = None
    has_access: Optional[bool] = None
    request_status: Optional[Literal['pending', 'approved', 'denied']] = None
    discord_server_name: Optional[str] = None

class CampaignListResponse(BaseModel):
    """Defines the structure for the response of the campaign list operation."""
    campaigns: List[CampaignResponse]
    total_count: int
    page: int
    limit: int


# --- Campaign Landing Page Operations ---

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

class CampaignLandingPageCreateRequest(CampaignLandingPageBase):
    campaign: str # The documentId of the campaign

class CampaignLandingPageUpdateRequest(CampaignLandingPageBase):
    campaign: Optional[Any] = None

class CampaignLandingPageResponse(CampaignLandingPageBase):
    id: int
    campaign: Optional[Dict[str, Any]] = None

# --- Onboarding Fields Operations ---

class OnboardingFieldBase(BaseModel):
    field_key: Optional[str] = None
    field_label: Optional[str] = None
    field_type: Optional[str] = None
    field_placeholder: Optional[str] = None
    field_description: Optional[str] = None
    field_options: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    is_enabled: Optional[bool] = None
    sort_order: Optional[int] = None
    validation_rules: Optional[Dict[str, Any]] = None
    discord_integration: Optional[Dict[str, Any]] = None

    @field_validator('field_options', mode='before')
    @classmethod
    def empty_list_to_dict(cls, v: Any) -> Optional[Dict[str, Any]]:
        if isinstance(v, list) and not v:
            return {}
        return v

class OnboardingFieldCreateRequest(OnboardingFieldBase):
    field_key: str
    field_label: str
    field_type: str
    campaign: str # The documentId of the campaign

class OnboardingFieldUpdateRequest(OnboardingFieldBase):
    pass

class OnboardingFieldResponse(OnboardingFieldBase):
    id: str
    documentId: Optional[str] = None
    campaign: Optional[Dict[str, Any]] = None # Populated campaign data

    @field_validator('id', mode='before')
    @classmethod
    def convert_id_to_string(cls, v: Any) -> str:
        if isinstance(v, int):
            return str(v)
        return v

class OnboardingFieldListResponse(BaseModel):
    onboarding_fields: List[OnboardingFieldResponse]
    total_count: int

# --- Onboarding Fields Batch Update ---

class OnboardingFieldData(BaseModel):
    id: Optional[str] = None
    documentId: Optional[str] = None
    field_key: str
    field_label: str
    field_type: str
    is_required: bool
    is_enabled: bool
    sort_order: int
    field_options: Optional[Dict[str, Any]] = {}
    validation_rules: Optional[Dict[str, Any]] = {}

class OnboardingFieldsBatchUpdateRequest(BaseModel):
    fields: List[OnboardingFieldData]
    delete_ids: Optional[List[str]] = []

# --- Landing Page Template Operations ---
 
class LandingPageTemplateResponse(BaseModel):
    id: int
    documentId: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    campaign_types: Optional[List[str]] = None
    template_structure: Optional[Dict[str, Any]] = None
    default_content: Optional[Dict[str, Any]] = None
    customizable_fields: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[List[str]] = None
    default_offer_value: Optional[str] = None
    default_hero_image_url: Optional[str] = None
    default_video_url: Optional[str] = None
    default_what_you_get: Optional[str] = None
    default_how_it_works: Optional[str] = None
    default_requirements: Optional[str] = None
    default_support_info: Optional[str] = None
    default_product_images: Optional[List[str]] = None
    color_scheme: Optional[Dict[str, Any]] = None
    layout_config: Optional[Dict[str, Any]] = None
    preview_image_url: Optional[str] = None
    is_active: Optional[bool] = True
    is_default: Optional[bool] = False

class LandingPageTemplateListResponse(BaseModel):
    """Defines the structure for the response of the landing page template list operation."""
    landing_page_templates: List[LandingPageTemplateResponse]
    total_count: int

class LandingPageTemplateCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    campaign_types: Optional[List[str]] = None
    template_structure: Optional[Dict[str, Any]] = None
    default_content: Optional[Dict[str, Any]] = None
    customizable_fields: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[List[str]] = None
    default_offer_value: Optional[str] = None
    default_hero_image_url: Optional[str] = None
    default_video_url: Optional[str] = None
    default_what_you_get: Optional[str] = None
    default_how_it_works: Optional[str] = None
    default_requirements: Optional[str] = None
    default_support_info: Optional[str] = None
    default_product_images: Optional[List[str]] = None
    color_scheme: Optional[Dict[str, Any]] = None
    layout_config: Optional[Dict[str, Any]] = None
    preview_image_url: Optional[str] = None
    is_active: Optional[bool] = True
    is_default: Optional[bool] = False

class LandingPageTemplateUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    campaign_types: Optional[List[str]] = None
    template_structure: Optional[Dict[str, Any]] = None
    default_content: Optional[Dict[str, Any]] = None
    customizable_fields: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[List[str]] = None
    default_offer_value: Optional[str] = None
    default_hero_image_url: Optional[str] = None
    default_video_url: Optional[str] = None
    default_what_you_get: Optional[str] = None
    default_how_it_works: Optional[str] = None
    default_requirements: Optional[str] = None
    default_support_info: Optional[str] = None
    default_product_images: Optional[List[str]] = None
    color_scheme: Optional[Dict[str, Any]] = None
    layout_config: Optional[Dict[str, Any]] = None
    preview_image_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

# --- Referral Operations ---

class ReferralBase(BaseModel):
    """Base model for a referral API request/response."""
    referrer_name: str = Field(..., description="The name of the person making the referral.")
    referrer_email: EmailStr = Field(..., description="The email of the person making thereferral.")
    referee_name: str = Field(..., description="The name of the person being referred.")
    referee_email: EmailStr = Field(..., description="The email of the person being referred.")
    notes: Optional[str] = Field(None, description="Optional notes about the referral.")

class ReferralCreateRequest(ReferralBase):
    """Model for creating a new referral."""
    campaign_id: str = Field(..., description="The document ID of the campaign this referral is for.")

class ReferralResponse(ReferralBase):
    """Model for a referral response."""
    id: int
    documentId: str
    campaign_id: str

class ReferralListResponse(BaseModel):
    """Defines the structure for the response of the referral list operation."""
    referrals: List[ReferralResponse]
    total_count: int

# --- Onboarding Operations ---

class OnboardingStartCreateRequest(BaseModel):
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    campaign: int

class OnboardingCompletionCreateRequest(BaseModel):
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    campaign: int

class OnboardingResponseCreateRequest(BaseModel):
    discord_user_id: str
    discord_username: Optional[str] = None
    field_key: str
    field_value: Optional[str] = None
    interaction_id: Optional[str] = None
    campaign: int
    referral_link: Optional[int] = None

class OnboardingStartResponse(BaseModel):
    id: int
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    started_at: datetime

class OnboardingCompletionResponse(BaseModel):
    id: int
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    completed_at: datetime

class OnboardingResponseResponse(BaseModel):
    id: int
    documentId: str
    discord_user_id: str
    discord_username: Optional[str] = None
    field_key: str
    field_value: Optional[str] = None
    interaction_id: Optional[str] = None

class OnboardingStartListResponse(BaseModel):
    starts: List[OnboardingStartResponse]
    total_count: int

class OnboardingCompletionListResponse(BaseModel):
    completions: List[OnboardingCompletionResponse]
    total_count: int

class OnboardingResponseListResponse(BaseModel):
    responses: List[OnboardingResponseResponse]
    total_count: int

# --- Campaign Template Operations ---

class CampaignTemplateResponse(BaseModel):
    id: int
    documentId: Optional[str] = None
    name: str
    description: Optional[str] = None
    campaign_type: str
    template_config: Dict[str, Any]
    category: Optional[str] = None
    is_default: Optional[bool] = False
    landing_page_template: Optional[LandingPageTemplateResponse] = None

class CampaignTemplateListResponse(BaseModel):
    templates: List[CampaignTemplateResponse]
    total_count: int

# --- Campaign Access Request Operations ---

class CampaignAccessRequestRequest(BaseModel):
    campaign_id: int
    user_id: int
    request_message: Optional[str] = None

class CampaignAccessRequestResponse(BaseModel):
    id: int
    documentId: Optional[str] = None
    campaign_id: int
    user_id: int
    request_message: Optional[str] = None
    request_status: str = "pending"  # pending, approved, denied
    requested_at: Optional[str] = None
    access_granted_at: Optional[str] = None
    is_active: Optional[bool] = True
    admin_response: Optional[str] = None
    campaign: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None

class CampaignAccessRequestUpdateRequest(BaseModel):
    request_status: Optional[Literal['pending', 'approved', 'denied']] = None
    admin_response: Optional[str] = None
    is_active: Optional[bool] = None

class CampaignAccessRequestListResponse(BaseModel):
    access_requests: List[CampaignAccessRequestResponse]
    total_count: int
