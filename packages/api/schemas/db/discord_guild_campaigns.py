from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional, Union, Any
from uuid import UUID

class DiscordGuildCampaignBase(BaseModel):
    client_id: UUID
    guild_id: str
    channel_id: Optional[str] = None
    campaign_name: str
    campaign_type: str
    referral_link_id: Optional[str] = None
    influencer_id: Optional[str] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    onboarding_flow: Optional[Union[dict, list]] = None
    referral_tracking_enabled: Optional[bool] = False
    auto_role_assignment: Optional[bool] = False
    total_interactions: Optional[int] = 0
    successful_onboardings: Optional[int] = 0
    referral_conversions: Optional[int] = 0
    is_active: Optional[bool] = True
    campaign_start_date: Optional[str] = None
    campaign_end_date: Optional[str] = None
    metadata: Optional[dict] = {}
    bot_name: Optional[str] = None
    bot_avatar_url: Optional[str] = None
    bot_personality: Optional[str] = None
    bot_response_style: Optional[str] = None
    brand_color: Optional[str] = None
    brand_logo_url: Optional[str] = None
    custom_commands: Optional[list] = []
    auto_responses: Optional[dict] = {}
    rate_limit_per_user: Optional[int] = 10
    allowed_channels: Optional[list] = []
    blocked_users: Optional[list] = []
    moderation_enabled: Optional[bool] = False
    content_filters: Optional[list] = []
    template: Optional[str] = None
    prefix: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    features: Optional[dict] = {}
    response_templates: Optional[dict] = {}
    embed_footer: Optional[str] = None
    webhook_routes: Optional[list] = []
    api_endpoints: Optional[dict] = {}
    external_integrations: Optional[dict] = {}
    configuration_version: Optional[int] = 1
    commands_used: Optional[int] = 0
    users_served: Optional[int] = 0
    last_activity_at: Optional[str] = None
    private_channel_id: Optional[str] = None
    access_control_enabled: Optional[bool] = False
    referral_only_access: Optional[bool] = False
    onboarding_channel_type: Optional[str] = "public"
    onboarding_completion_requirements: Optional[dict] = {}
    private_channel_setup: Optional[dict] = {}
    target_role_ids: Optional[list] = []
    paused_at: Optional[str] = None
    is_deleted: Optional[bool] = False
    deleted_at: Optional[datetime] = None

class DiscordGuildCampaignCreate(DiscordGuildCampaignBase):
    pass

class DiscordGuildCampaignUpdate(BaseModel):
    client_id: Optional[UUID] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    campaign_name: Optional[str] = None
    campaign_type: Optional[str] = None
    referral_link_id: Optional[str] = None
    influencer_id: Optional[str] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    onboarding_flow: Optional[dict] = None
    referral_tracking_enabled: Optional[bool] = None
    auto_role_assignment: Optional[bool] = None
    total_interactions: Optional[int] = None
    successful_onboardings: Optional[int] = None
    referral_conversions: Optional[int] = None
    is_active: Optional[bool] = None
    campaign_start_date: Optional[str] = None
    campaign_end_date: Optional[str] = None
    metadata: Optional[dict] = None
    bot_name: Optional[str] = None
    bot_avatar_url: Optional[str] = None
    bot_personality: Optional[str] = None
    bot_response_style: Optional[str] = None
    brand_color: Optional[str] = None
    brand_logo_url: Optional[str] = None
    custom_commands: Optional[list] = None
    auto_responses: Optional[dict] = None
    rate_limit_per_user: Optional[int] = None
    allowed_channels: Optional[list] = None
    blocked_users: Optional[list] = None
    moderation_enabled: Optional[bool] = None
    content_filters: Optional[list] = None
    template: Optional[str] = None
    prefix: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    features: Optional[dict] = None
    response_templates: Optional[dict] = None
    embed_footer: Optional[str] = None
    webhook_routes: Optional[list] = None
    api_endpoints: Optional[dict] = None
    external_integrations: Optional[dict] = None
    configuration_version: Optional[int] = None
    commands_used: Optional[int] = None
    users_served: Optional[int] = None
    last_activity_at: Optional[str] = None
    private_channel_id: Optional[str] = None
    access_control_enabled: Optional[bool] = None
    referral_only_access: Optional[bool] = None
    onboarding_channel_type: Optional[str] = None
    onboarding_completion_requirements: Optional[dict] = None
    private_channel_setup: Optional[dict] = None
    target_role_ids: Optional[list] = None
    paused_at: Optional[str] = None
    is_deleted: Optional[bool] = None
    deleted_at: Optional[datetime] = None

class DiscordGuildCampaign(DiscordGuildCampaignBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            UUID: str,
            datetime: lambda dt: dt.isoformat() if dt else None
        }
    )
