from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

# Discord Integration Schemas

class Campaign(BaseModel):
    id: int
    campaign_name: str
    description: Optional[str] = None
    channel_id: Optional[str] = None

class GetCampaignsResponse(BaseModel):
    campaigns: List[Campaign]

class RequestAccessRequest(BaseModel):
    user_id: str
    user_tag: str
    guild_id: str
    email: EmailStr
    name: str

class RequestAccessResponse(BaseModel):
    success: bool
    message: str

class HasVerifiedRoleResponse(BaseModel):
    has_role: bool

# Discord Onboarding Schemas

class OnboardingField(BaseModel):
    field_key: str
    field_label: str
    field_type: str  # text, email, number, boolean, url, select, multiselect
    field_placeholder: Optional[str] = None
    field_description: Optional[str] = None
    field_options: Optional[List[str]] = None
    is_required: bool = False
    validation_rules: Optional[Dict[str, Any]] = None

class OnboardingStartRequest(BaseModel):
    campaign_id: str
    discord_user_id: str
    discord_username: str

class OnboardingStartResponse(BaseModel):
    success: bool
    fields: List[OnboardingField]

class OnboardingSubmitRequest(BaseModel):
    campaign_id: str
    discord_user_id: str
    discord_username: str
    responses: Dict[str, Any]

class OnboardingSubmitResponse(BaseModel):
    success: bool
    message: str