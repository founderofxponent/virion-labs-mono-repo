from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

# Discord Integration Schemas

class Campaign(BaseModel):
    id: int
    documentId: str
    name: str  # Changed from campaign_name to match Strapi client transformation
    description: Optional[str] = None
    channel_id: Optional[str] = None
    target_role_ids: Optional[List[str]] = None
    auto_role_assignment: Optional[bool] = False

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
    sort_order: Optional[int] = 0
    step_number: Optional[int] = 1
    step_role_ids: Optional[List[str]] = None

class OnboardingStartRequest(BaseModel):
    campaign_id: str
    discord_user_id: str
    discord_username: str

class OnboardingStartResponse(BaseModel):
    success: bool
    fields: List[OnboardingField]
    message: Optional[str] = None

class OnboardingSubmitRequest(BaseModel):
    campaign_id: str
    discord_user_id: str
    discord_username: str
    responses: Dict[str, Any]

class OnboardingSubmitResponse(BaseModel):
    success: bool
    message: str

# Discord Invite Schemas

class CreateManagedInviteRequest(BaseModel):
    referral_code: str

class CreateManagedInviteResponse(BaseModel):
    success: bool
    invite_url: Optional[str] = None
    message: Optional[str] = None

# Client Discord Connection Schemas (for dashboard integrations page)
class DiscordChannel(BaseModel):
    id: str
    name: str
    type: Optional[int] = None
    topic: Optional[str] = None

class DiscordRole(BaseModel):
    id: str
    name: str
    color: Optional[int] = None
    memberCount: Optional[int] = None

class ClientDiscordConnection(BaseModel):
    id: Optional[int] = None
    documentId: Optional[str] = None
    client_id: Optional[int] = None
    guild_id: str
    guild_name: Optional[str] = None
    guild_icon_url: Optional[str] = None
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    channels: Optional[List[DiscordChannel]] = None
    roles: Optional[List[DiscordRole]] = None
    status: Optional[str] = None
    last_synced_at: Optional[str] = None
    verified_role_id: Optional[str] = None

class ClientDiscordConnectionCreateRequest(BaseModel):
    guild_id: str
    guild_name: Optional[str] = None
    guild_icon_url: Optional[str] = None
    channels: Optional[List[DiscordChannel]] = None
    roles: Optional[List[DiscordRole]] = None

class ClientDiscordConnectionResponse(BaseModel):
    connection: ClientDiscordConnection

class ClientDiscordConnectionListResponse(BaseModel):
    connections: List[ClientDiscordConnection]

class ClientDiscordConnectionBotSyncRequest(BaseModel):
    client_document_id: str
    guild_id: str
    guild_name: Optional[str] = None
    guild_icon_url: Optional[str] = None
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    channels: Optional[List[DiscordChannel]] = None
    roles: Optional[List[DiscordRole]] = None

class ClientDiscordSyncStartRequest(BaseModel):
    guild_id: str

class AssignVerifiedRoleRequest(BaseModel):
    connection_id: str
    guild_id: str
    role_id: str

class AssignVerifiedRoleResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    connection: Optional[ClientDiscordConnection] = None
