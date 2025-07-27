from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class BotCampaign(BaseModel):
    id: str
    documentId: Optional[str] = Field(None, alias="document_id")
    name: str
    type: str
    guild_id: str
    channel_id: Optional[str] = None
    client_id: str
    client_name: str
    client_industry: str
    display_name: str
    template: str
    description: Optional[str] = None
    is_active: bool
    paused_at: Optional[datetime] = None
    campaign_end_date: Optional[datetime] = None
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    campaign_start_date: datetime
    created_at: datetime
    updated_at: datetime
    total_interactions: int
    successful_onboardings: int
    referral_conversions: int
    last_activity_at: Optional[datetime] = None
    configuration_version: Optional[int] = None
    referral_link_id: Optional[str] = None
    referral_link_title: Optional[str] = None
    referral_code: Optional[str] = None
    referral_platform: Optional[str] = None
    auto_role_assignment: Optional[bool] = None
    target_role_ids: Optional[List[str]] = None
    referral_tracking_enabled: Optional[bool] = None
    moderation_enabled: Optional[bool] = None
    bot_name: Optional[str] = None
    bot_personality: Optional[str] = None
    bot_response_style: Optional[str] = None
    brand_color: Optional[str] = None
    brand_logo_url: Optional[str] = None
    welcome_message: Optional[str] = None
    webhook_url: Optional[str] = None
    rate_limit_per_user: Optional[int] = None
    features: Optional[Dict[str, Any]] = None
    auto_responses: Optional[Dict[str, Any]] = None
    custom_commands: Optional[List[Any]] = None
    onboarding_flow: Optional[Union[Dict[str, Any], List[Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

    @field_validator('onboarding_flow', mode='before')
    @classmethod
    def validate_onboarding_flow(cls, v):
        """
        Support both dictionary and list formats for onboarding_flow.
        Convert list format to dictionary format for consistency.
        """
        if v is None:
            return None
        
        # If it's already a dictionary, return as-is
        if isinstance(v, dict):
            return v
        
        # If it's a list (legacy format), convert to dictionary
        if isinstance(v, list):
            # Convert list of field objects to a structured dictionary
            return {
                "fields": v,
                "legacy_format": True  # Flag to indicate conversion happened
            }
        
        # If it's neither dict nor list, return as-is and let normal validation handle it
        return v

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class BotCampaignCreate(BaseModel):
    client_id: str
    guild_id: str
    channel_id: Optional[str] = None
    campaign_name: str
    campaign_template: str
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
    onboarding_flow: Optional[Union[Dict[str, Any], List[Any]]] = None
    rate_limit_per_user: Optional[int] = None
    allowed_channels: Optional[List[str]] = None
    blocked_users: Optional[List[str]] = None
    moderation_enabled: Optional[bool] = None
    content_filters: Optional[List[str]] = None
    campaign_start_date: Optional[datetime] = None
    campaign_end_date: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @field_validator('onboarding_flow', mode='before')
    @classmethod
    def validate_onboarding_flow_create(cls, v):
        """
        Support both dictionary and list formats for onboarding_flow.
        Convert list format to dictionary format for consistency.
        """
        if v is None:
            return None
        
        # If it's already a dictionary, return as-is
        if isinstance(v, dict):
            return v
        
        # If it's a list (legacy format), convert to dictionary
        if isinstance(v, list):
            # Convert list of field objects to a structured dictionary
            return {
                "fields": v,
                "legacy_format": True  # Flag to indicate conversion happened
            }
        
        # If it's neither dict nor list, return as-is and let normal validation handle it
        return v

class BotCampaignUpdate(BotCampaignCreate):
    id: str
