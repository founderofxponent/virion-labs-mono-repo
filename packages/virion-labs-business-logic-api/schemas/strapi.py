from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Literal, Union
from datetime import datetime
from domain.influencers.schemas import ReferralLinkBase, ReferralLinkCreate, ReferralLinkUpdate

class Role(BaseModel):
    id: int
    name: str
    description: str
    type: str

class Media(BaseModel):
    id: int
    url: str
    name: str
    alternativeText: Optional[str] = None
    caption: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    formats: Optional[Dict[str, Any]] = None
    hash: str
    ext: str
    mime: str
    size: int
    previewUrl: Optional[str] = None
    provider: str
    provider_metadata: Optional[Dict[str, Any]] = None

class User(BaseModel):
    id: int
    username: str
    email: str
    provider: Optional[str] = None
    confirmed: Optional[bool] = False
    blocked: Optional[bool] = False
    role: Optional[Role] = None
    full_name: Optional[str] = None
    avatar_url: Optional[Media] = None

class ReferralAnalytic(BaseModel):
    id: int
    event_type: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    referrer: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    conversion_value: Optional[float] = 0.00
    metadata: Optional[Dict[str, Any]] = None

class StrapiReferralLinkCreate(ReferralLinkCreate):
    pass

class StrapiReferralLinkUpdate(ReferralLinkUpdate):
    pass

class ReferralLink(ReferralLinkBase):
    id: int
    documentId: str
    referral_code: str
    referral_url: str
    thumbnail_url: Optional[List[Media]] = None
    clicks: Optional[int] = 0
    conversions: Optional[int] = 0
    conversion_rate: Optional[float] = None
    earnings: Optional[float] = 0
    discord_guild_id: Optional[str] = None
    last_conversion_at: Optional[datetime] = None
    private_channel_id: Optional[str] = None
    access_role_id: Optional[str] = None
    custom_invite_code: Optional[str] = None
    referral_analytics: Optional[List[ReferralAnalytic]] = None
    campaign_onboarding_responses: Optional[List['CampaignOnboardingResponse']] = None
    influencer: Optional[User] = None
    campaign: Optional['Campaign'] = None

class CampaignOnboardingResponse(BaseModel):
    id: int
    discord_user_id: str
    discord_username: Optional[str] = None
    field_key: str
    field_value: Optional[str] = None
    referral_id: Optional[str] = None
    interaction_id: Optional[str] = None
    referral_link: Optional[ReferralLink] = None
    campaign: Optional['Campaign'] = None

class CampaignOnboardingFieldBase(BaseModel):
    field_key: str
    field_label: str
    field_type: Literal['text', 'email', 'number', 'boolean', 'url', 'select', 'multiselect']
    field_placeholder: Optional[str] = None
    field_description: Optional[str] = None
    field_options: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = False
    is_enabled: Optional[bool] = True
    sort_order: Optional[int] = 0
    validation_rules: Optional[Dict[str, Any]] = None
    discord_integration: Optional[Dict[str, Any]] = None

    @field_validator('field_options', mode='before')
    @classmethod
    def empty_list_to_dict(cls, v: Any) -> Optional[Dict[str, Any]]:
        if isinstance(v, list) and not v:
            return {}
        return v

class CampaignOnboardingField(CampaignOnboardingFieldBase):
    id: int
    documentId: Optional[str] = None
    campaign: Optional['Campaign'] = None

class StrapiCampaignOnboardingFieldCreate(CampaignOnboardingFieldBase):
    campaign: int # Expecting the campaign ID

class StrapiCampaignOnboardingFieldUpdate(CampaignOnboardingFieldBase):
    field_key: Optional[str] = None
    field_label: Optional[str] = None
    field_type: Optional[Literal['text', 'email', 'number', 'boolean', 'url', 'select', 'multiselect']] = None
    campaign: Optional[int] = None

class CampaignOnboardingStart(BaseModel):
    id: int
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    started_at: Optional[datetime] = None
    campaign: Optional['Campaign'] = None

class CampaignOnboardingCompletion(BaseModel):
    id: int
    discord_user_id: str
    discord_username: str
    guild_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    campaign: Optional['Campaign'] = None

class LandingPageTemplateBase(BaseModel):
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

class LandingPageTemplate(LandingPageTemplateBase):
    id: int
    documentId: str

class StrapiLandingPageTemplateCreate(LandingPageTemplateBase):
    pass

class StrapiLandingPageTemplateUpdate(LandingPageTemplateBase):
    name: Optional[str] = None # All fields are optional for update

class CampaignTemplate(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    campaign_type: Literal['referral_onboarding', 'community_engagement', 'product_promotion', 'custom', 'vip_support']
    template_config: Dict[str, Any]
    category: Optional[str] = None
    is_default: Optional[bool] = False
    landing_page_template: Optional[LandingPageTemplate] = None

# Referral Schemas
class StrapiReferralCreate(ReferralBase):
    pass

class Referral(ReferralBase):
    id: int
    documentId: str

class ClientBase(BaseModel):
    name: str
    industry: Optional[str] = None
    client_status: Optional[Literal['active', 'inactive']] = 'active'
    website: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_email: Optional[str] = None

class Client(ClientBase):
    id: int
    documentId: Optional[str] = None
    logo: Optional[Media] = None
    influencers: Optional[int] = 0
    join_date: Optional[datetime] = None
    campaigns: Optional[List['Campaign']] = None

class StrapiClientCreate(ClientBase):
    pass

class StrapiClientUpdate(ClientBase):
    name: Optional[str] = None # All fields are optional for updates

class CampaignInfluencerAccess(BaseModel):
    id: int
    access_granted_at: Optional[datetime] = None
    is_active: Optional[bool] = True
    request_status: Optional[Literal['pending', 'approved', 'denied']] = 'pending'
    requested_at: Optional[datetime] = None
    request_message: Optional[str] = None
    admin_response: Optional[str] = None
    user: Optional[User] = None
    campaign: Optional['Campaign'] = None

class Campaign(BaseModel):
    id: int
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
    client: Optional[Client] = None
    referral_links: Optional[List[ReferralLink]] = None
    campaign_influencer_accesses: Optional[List[CampaignInfluencerAccess]] = None
    campaign_landing_page: Optional['CampaignLandingPage'] = None
    campaign_onboarding_fields: Optional[List[CampaignOnboardingField]] = None
    campaign_onboarding_responses: Optional[List[CampaignOnboardingResponse]] = None
    campaign_onboarding_starts: Optional[List[CampaignOnboardingStart]] = None
    bot_personality: Optional[str] = 'helpful'
    bot_response_style: Optional[str] = 'friendly'
    auto_role_assignment: Optional[bool] = False
    target_role_ids: Optional[List[str]] = None
    referral_tracking_enabled: Optional[bool] = True
    moderation_enabled: Optional[bool] = True
    rate_limit_per_user: Optional[int] = 5
    auto_responses: Optional[Dict[str, Any]] = None
    custom_commands: Optional[Dict[str, Any]] = None
    campaign_onboarding_completions: Optional[List[CampaignOnboardingCompletion]] = None
    total_investment: Optional[float] = 0
    value_per_conversion: Optional[float] = 0

class StrapiCampaignCreate(BaseModel):
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
    metadata: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None
    bot_personality: Optional[str] = 'helpful'
    bot_response_style: Optional[str] = 'friendly'
    auto_role_assignment: Optional[bool] = False
    target_role_ids: Optional[List[str]] = None
    referral_tracking_enabled: Optional[bool] = True
    moderation_enabled: Optional[bool] = True
    rate_limit_per_user: Optional[int] = 5
    auto_responses: Optional[Dict[str, Any]] = None
    custom_commands: Optional[Dict[str, Any]] = None
    total_investment: Optional[float] = 0
    value_per_conversion: Optional[float] = 0
    client: int # Relation ID

class StrapiCampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[Literal['referral_onboarding', 'community_engagement', 'product_promotion', 'custom', 'vip_support']] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    bot_name: Optional[str] = None
    bot_avatar_url: Optional[str] = None
    brand_color: Optional[str] = None
    brand_logo_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None
    bot_personality: Optional[str] = None
    bot_response_style: Optional[str] = None
    auto_role_assignment: Optional[bool] = None
    target_role_ids: Optional[List[str]] = None
    referral_tracking_enabled: Optional[bool] = None
    moderation_enabled: Optional[bool] = None
    rate_limit_per_user: Optional[int] = None
    auto_responses: Optional[Dict[str, Any]] = None
    custom_commands: Optional[Dict[str, Any]] = None
    total_investment: Optional[float] = None
    value_per_conversion: Optional[float] = None
    client: Optional[int] = None # Relation ID
 
class CampaignLandingPageBase(BaseModel):
    offer_title: Optional[str] = None
    offer_description: Optional[str] = None
    offer_highlights: Optional[Union[List[Any], Dict[str, Any]]] = None
    offer_value: Optional[str] = None
    offer_expiry_date: Optional[datetime] = None
    product_images: Optional[Union[List[Any], Dict[str, Any]]] = None
    video_url: Optional[str] = None
    what_you_get: Optional[str] = None
    how_it_works: Optional[str] = None
    requirements: Optional[str] = None
    support_info: Optional[str] = None
    inherited_from_template: Optional[bool] = False

class CampaignLandingPage(CampaignLandingPageBase):
    id: int
    hero_image_url: Optional[Media] = None
    landing_page_template: Optional[LandingPageTemplate] = None
    campaign: Optional[Campaign] = None

class StrapiCampaignLandingPageUpdate(CampaignLandingPageBase):
    hero_image_url: Optional[int] = None  # Media ID
    landing_page_template: Optional[int] = None  # Relation ID
    campaign: Optional[int] = None  # Relation ID

class StrapiCampaignLandingPageCreate(CampaignLandingPageBase):
    campaign: int # Relation ID

class UserSetting(BaseModel):
    id: int
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    discord_username: Optional[str] = None
    website_url: Optional[str] = None
    email_notifications_new_referral: Optional[bool] = True
    email_notifications_link_clicks: Optional[bool] = False
    email_notifications_weekly_reports: Optional[bool] = True
    email_notifications_product_updates: Optional[bool] = True
    push_notifications_new_referral: Optional[bool] = False
    push_notifications_link_clicks: Optional[bool] = False
    push_notifications_weekly_reports: Optional[bool] = False
    push_notifications_product_updates: Optional[bool] = False
    profile_visibility: Optional[Literal['public', 'private']] = None
    show_earnings: Optional[bool] = False
    show_referral_count: Optional[bool] = True
    webhook_url: Optional[str] = None
    webhook_events: Optional[Dict[str, Any]] = None
    api_key: Optional[str] = None
    api_key_test: Optional[str] = None
    api_key_regenerated_at: Optional[datetime] = None
    theme: Optional[Literal['light', 'dark', 'system']] = 'system'
    language: Optional[str] = 'en'
    timezone: Optional[str] = 'UTC'
    currency: Optional[str] = 'USD'
    two_factor_enabled: Optional[bool] = False
    login_notifications: Optional[bool] = True

# Update forward references to resolve circular dependencies
ReferralLink.update_forward_refs()
CampaignOnboardingResponse.update_forward_refs()
CampaignOnboardingField.update_forward_refs()
StrapiCampaignOnboardingFieldCreate.update_forward_refs()
StrapiCampaignOnboardingFieldUpdate.update_forward_refs()
CampaignOnboardingStart.update_forward_refs()
CampaignOnboardingCompletion.update_forward_refs()
Client.update_forward_refs()
CampaignInfluencerAccess.update_forward_refs()
Campaign.update_forward_refs()
CampaignLandingPage.update_forward_refs()
StrapiCampaignCreate.update_forward_refs()
StrapiCampaignUpdate.update_forward_refs()
LandingPageTemplate.update_forward_refs()