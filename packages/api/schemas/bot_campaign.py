from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List, Union
from uuid import UUID

class BotCampaignBase(BaseModel):
    client_id: UUID
    guild_id: str
    channel_id: Optional[str] = None
    campaign_name: str
    campaign_type: str
    referral_link_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    description: Optional[str] = None

class BotCampaign(BotCampaignBase):
    id: UUID
    onboarding_flow: Optional[Union[dict, list]] = None
    referral_tracking_enabled: Optional[bool] = True
    auto_role_assignment: Optional[bool] = False
    total_interactions: Optional[int] = 0
    successful_onboardings: Optional[int] = 0
    referral_conversions: Optional[int] = 0
    is_active: Optional[bool] = True
    campaign_start_date: Optional[datetime] = None
    campaign_end_date: Optional[datetime] = None
    metadata: Optional[dict] = {}
    bot_name: Optional[str] = "Virion Bot"
    bot_avatar_url: Optional[str] = None
    bot_personality: Optional[str] = "helpful"
    bot_response_style: Optional[str] = "friendly"
    brand_color: Optional[str] = "#6366f1"
    brand_logo_url: Optional[str] = None
    custom_commands: Optional[list] = []
    auto_responses: Optional[dict] = {}
    rate_limit_per_user: Optional[int] = 5
    allowed_channels: Optional[list] = []
    blocked_users: Optional[list] = []
    moderation_enabled: Optional[bool] = True
    content_filters: Optional[list] = []
    template: Optional[str] = "standard"
    prefix: Optional[str] = "!"
    avatar_url: Optional[str] = None
    features: Optional[dict] = {}
    response_templates: Optional[dict] = {}
    embed_footer: Optional[str] = None
    webhook_routes: Optional[list] = []
    api_endpoints: Optional[dict] = {}
    external_integrations: Optional[dict] = {}
    configuration_version: Optional[int] = 2
    commands_used: Optional[int] = 0
    users_served: Optional[int] = 0
    last_activity_at: Optional[datetime] = None
    private_channel_id: Optional[str] = None
    access_control_enabled: Optional[bool] = False
    referral_only_access: Optional[bool] = False
    onboarding_channel_type: Optional[str] = "channel"
    onboarding_completion_requirements: Optional[dict] = {}
    private_channel_setup: Optional[dict] = {}
    target_role_ids: Optional[List[str]] = None
    paused_at: Optional[datetime] = None
    is_deleted: Optional[bool] = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BotCampaignCreate(BotCampaignBase):
    client_id: UUID

class BotCampaignUpdate(BaseModel):
    client_id: Optional[UUID] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    campaign_name: Optional[str] = None
    campaign_type: Optional[str] = None
    referral_link_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    campaign_end_date: Optional[datetime] = None
    onboarding_flow: Optional[Union[dict, list]] = None

class CampaignStats(BaseModel):
    total_interactions: Optional[int] = None
    successful_onboardings: Optional[int] = None
    referral_conversions: Optional[int] = None
    commands_used: Optional[int] = None
    users_served: Optional[int] = None