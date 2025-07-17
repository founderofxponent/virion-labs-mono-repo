from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any, Union
from uuid import UUID
from enum import Enum

# Discord Guild Campaign schemas
class DiscordGuildCampaignBase(BaseModel):
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

class DiscordGuildCampaign(DiscordGuildCampaignBase):
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

class DiscordGuildCampaignCreate(DiscordGuildCampaignBase):
    pass

class DiscordGuildCampaignUpdate(BaseModel):
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

# Legacy Campaign schemas for backward compatibility
class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class Campaign(CampaignBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignAccessRequest(BaseModel):
    reason: Optional[str] = None
    additional_info: Optional[str] = None

# Referral Link schemas based on actual database structure
class ReferralLinkBase(BaseModel):
    influencer_id: UUID
    title: str
    description: Optional[str] = None
    platform: str
    original_url: str
    referral_code: str
    referral_url: str
    thumbnail_url: Optional[str] = None

class ReferralLinkCreate(ReferralLinkBase):
    campaign_id: Optional[UUID] = None
    discord_invite_url: Optional[str] = None
    discord_guild_id: Optional[str] = None
    redirect_to_discord: Optional[bool] = False
    landing_page_enabled: Optional[bool] = True

class ReferralLink(ReferralLinkBase):
    id: UUID
    clicks: Optional[int] = 0
    earnings: Optional[float] = 0.00
    is_active: Optional[bool] = True
    expires_at: Optional[datetime] = None
    campaign_id: Optional[UUID] = None
    discord_invite_url: Optional[str] = None
    discord_guild_id: Optional[str] = None
    redirect_to_discord: Optional[bool] = False
    landing_page_enabled: Optional[bool] = True
    conversions: Optional[int] = 0
    last_conversion_at: Optional[datetime] = None
    private_channel_id: Optional[str] = None
    access_role_id: Optional[str] = None
    custom_invite_code: Optional[str] = None
    metadata: Optional[dict] = {}
    conversion_rate: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Data Export schemas
class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"

class ExportType(str, Enum):
    CAMPAIGN_DATA = "campaign_data"
    USER_DATA = "user_data"
    ANALYTICS_DATA = "analytics_data"
    REFERRAL_DATA = "referral_data"
    ONBOARDING_DATA = "onboarding_data"

class DataExportRequest(BaseModel):
    export_type: ExportType
    format: ExportFormat
    campaign_ids: Optional[List[UUID]] = None
    guild_ids: Optional[List[str]] = None
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    include_pii: Optional[bool] = False
    filters: Optional[dict] = {}

class DataExportResponse(BaseModel):
    success: bool
    message: str
    export_id: Optional[UUID] = None
    estimated_completion_time: Optional[datetime] = None
    download_url: Optional[str] = None

class DataExportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"

class DataExport(BaseModel):
    id: UUID
    export_type: ExportType
    format: ExportFormat
    status: DataExportStatus
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    record_count: Optional[int] = None
    error_message: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
