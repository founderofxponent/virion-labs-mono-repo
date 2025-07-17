from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from uuid import UUID
from enum import Enum

class TemplateCategory(str, Enum):
    PROMOTION = "promotion"
    REFERRAL = "referral"
    SUPPORT = "support"
    COMMUNITY = "community"
    CUSTOM = "custom"

FieldType = Literal[
    "text",
    "email",
    "select",
    "checkbox",
    "textarea",
    "number",
    "date",
    "url",
    "multiselect"
]

class OnboardingFieldValidation(BaseModel):
    required: Optional[bool] = True
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    options: Optional[List[str]] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None

class OnboardingFieldDiscordIntegration(BaseModel):
    collect_in_dm: Optional[bool] = False
    auto_role_on_completion: Optional[str] = None
    trigger_webhook: Optional[str] = None

class OnboardingField(BaseModel):
    id: str
    type: FieldType
    question: str
    placeholder: Optional[str] = None
    required: Optional[bool] = True
    validation: Optional[OnboardingFieldValidation] = None
    discord_integration: Optional[OnboardingFieldDiscordIntegration] = None
    order: Optional[int] = 0

class BotConfig(BaseModel):
    prefix: Optional[str] = "/"
    bot_name: Optional[str] = "Virion Bot"
    bot_personality: Optional[str] = "helpful"
    bot_response_style: Optional[str] = "friendly"
    welcome_message: Optional[str] = None
    features: Optional[Dict[str, Any]] = {}
    response_templates: Optional[Dict[str, str]] = {}
    onboarding_completion_requirements: Optional[Dict[str, Any]] = {}
    auto_role_assignment: Optional[bool] = False
    rate_limit_per_user: Optional[int] = 5
    moderation_enabled: Optional[bool] = True

class AnalyticsConfig(BaseModel):
    primary_metrics: Optional[List[str]] = []
    tracking_enabled: Optional[bool] = True
    custom_events: Optional[List[str]] = []
    retention_period_days: Optional[int] = 90

class LandingPageConfig(BaseModel):
    default_theme: Optional[str] = "modern"
    color_scheme: Optional[Dict[str, str]] = {}
    layout_config: Optional[Dict[str, Any]] = {}
    customizable_fields: Optional[List[str]] = []

class TemplateConfig(BaseModel):
    bot_config: Optional[BotConfig] = None
    onboarding_fields: Optional[List[OnboardingField]] = []
    analytics_config: Optional[AnalyticsConfig] = None
    landing_page_config: Optional[LandingPageConfig] = None

class CampaignTemplateBase(BaseModel):
    campaign_type: str = Field(..., description="Unique identifier for the template")
    name: str
    description: Optional[str] = None
    category: TemplateCategory
    template_config: Optional[TemplateConfig] = None
    default_landing_page_id: Optional[UUID] = None
    is_default: Optional[bool] = False

class CampaignTemplate(CampaignTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignTemplateCreate(CampaignTemplateBase):
    pass

class CampaignTemplateUpdate(BaseModel):
    campaign_type: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TemplateCategory] = None
    template_config: Optional[TemplateConfig] = None
    default_landing_page_id: Optional[UUID] = None
    is_default: Optional[bool] = None

class CampaignTemplateResponse(BaseModel):
    success: bool
    message: str
    template: Optional[CampaignTemplate] = None

class CampaignTemplateListResponse(BaseModel):
    success: bool
    message: str
    templates: List[CampaignTemplate]
    total_count: int

# Landing Page Template schemas
class LandingPageTemplateBase(BaseModel):
    template_id: str = Field(..., description="Human-readable template ID")
    name: str
    description: Optional[str] = None
    category: TemplateCategory
    campaign_types: Optional[List[str]] = []
    default_offer_title: Optional[str] = None
    default_offer_subtitle: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_cta_text: Optional[str] = "Join Now"
    default_success_message: Optional[str] = None
    customizable_fields: Optional[List[str]] = []
    color_scheme: Optional[Dict[str, str]] = {}
    layout_config: Optional[Dict[str, Any]] = {}
    is_default: Optional[bool] = False

class LandingPageTemplate(LandingPageTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LandingPageTemplateCreate(LandingPageTemplateBase):
    pass

class LandingPageTemplateUpdate(BaseModel):
    template_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[TemplateCategory] = None
    campaign_types: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_subtitle: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_cta_text: Optional[str] = None
    default_success_message: Optional[str] = None
    customizable_fields: Optional[List[str]] = None
    color_scheme: Optional[Dict[str, str]] = None
    layout_config: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None

class LandingPageTemplateResponse(BaseModel):
    success: bool
    message: str
    template: Optional[LandingPageTemplate] = None

class LandingPageTemplateListResponse(BaseModel):
    success: bool
    message: str
    templates: List[LandingPageTemplate]
    total_count: int

# Template Application schemas
class ApplyTemplateRequest(BaseModel):
    campaign_id: UUID
    template_id: UUID
    override_fields: Optional[List[OnboardingField]] = None
    custom_config: Optional[Dict[str, Any]] = None

class ApplyTemplateResponse(BaseModel):
    success: bool
    message: str
    applied_fields: Optional[List[OnboardingField]] = None
    campaign_id: Optional[UUID] = None

# Template with Landing Page (joined data)
class CampaignTemplateWithLandingPage(CampaignTemplate):
    landing_page_template: Optional[LandingPageTemplate] = None

class CampaignTemplateWithLandingPageResponse(BaseModel):
    success: bool
    message: str
    template: Optional[CampaignTemplateWithLandingPage] = None

class CampaignTemplateWithLandingPageListResponse(BaseModel):
    success: bool
    message: str
    templates: List[CampaignTemplateWithLandingPage]
    total_count: int