from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Dict, Any, Union
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

# --- Campaign List Operation ---

class CampaignListResponse(BaseModel):
    """
    Defines the structure for the response of the campaign list operation.
    """
    campaigns: List[Dict[str, Any]]
    total_count: int
    page: int
    limit: int

# --- Campaign Update Operation ---

class CampaignUpdateRequest(BaseModel):
    client_id: Optional[str] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    campaign_name: Optional[str] = None
    campaign_template: Optional[str] = None
    campaign_type: Optional[str] = None
    prefix: Optional[str] = None
    description: Optional[str] = None
    bot_name: Optional[str] = None
    bot_avatar_url: Optional[str] = None
    bot_personality: Optional[str] = None
    bot_response_style: Optional[str] = None
    brand_color: Optional[str] = None
    brand_logo_url: Optional[str] = None
    features: Optional[Dict[str, Any]] = None
    custom_commands: Optional[List[Any]] = None
    auto_responses: Optional[Dict[str, Any]] = None
    response_templates: Optional[Dict[str, Any]] = None
    embed_footer: Optional[str] = None
    welcome_message: Optional[str] = None
    webhook_url: Optional[str] = None
    webhook_routes: Optional[List[Any]] = None
    api_endpoints: Optional[Dict[str, Any]] = None
    external_integrations: Optional[Dict[str, Any]] = None
    referral_link_id: Optional[str] = None
    influencer_id: Optional[str] = None
    referral_tracking_enabled: Optional[bool] = None
    auto_role_assignment: Optional[bool] = None
    target_role_ids: Optional[List[str]] = None
    rate_limit_per_user: Optional[int] = None
    allowed_channels: Optional[List[str]] = None
    blocked_users: Optional[List[str]] = None
    moderation_enabled: Optional[bool] = None
    content_filters: Optional[List[str]] = None
    campaign_start_date: Optional[str] = None
    end_date: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    onboarding_questions: Optional[List[Any]] = None


# --- Campaign Landing Page Update Operation ---

class CampaignLandingPageUpdateRequest(BaseModel):
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
 
class LandingPageTemplateListResponse(BaseModel):
    """
    Defines the structure for the response of the landing page template list operation.
    """
    landing_page_templates: List[Dict[str, Any]]
    total_count: int

class LandingPageTemplateResponse(BaseModel):
    """
    Defines the structure for the response of a single landing page template operation.
    """
    landing_page_template: Dict[str, Any]

class LandingPageTemplateCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    campaign_types: Optional[List[str]] = None
    template_structure: Optional[Dict[str, Any]] = None
    customizable_fields: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[List[str]] = None
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
    customizable_fields: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[List[str]] = None
    color_scheme: Optional[Dict[str, Any]] = None
    layout_config: Optional[Dict[str, Any]] = None
    preview_image_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
