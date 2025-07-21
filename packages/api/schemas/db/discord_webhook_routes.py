from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class DiscordWebhookRouteBase(BaseModel):
    guild_id: str
    channel_id: Optional[str] = None
    client_id: UUID
    webhook_url: str
    webhook_type: str
    message_patterns: Optional[list] = None
    user_roles: Optional[list] = None
    command_prefixes: Optional[list] = None
    include_referral_context: Optional[bool] = None
    include_user_history: Optional[bool] = None
    rate_limit_per_minute: Optional[int] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class DiscordWebhookRouteCreate(DiscordWebhookRouteBase):
    pass

class DiscordWebhookRouteUpdate(BaseModel):
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    client_id: Optional[UUID] = None
    webhook_url: Optional[str] = None
    webhook_type: Optional[str] = None
    message_patterns: Optional[list] = None
    user_roles: Optional[list] = None
    command_prefixes: Optional[list] = None
    include_referral_context: Optional[bool] = None
    include_user_history: Optional[bool] = None
    rate_limit_per_minute: Optional[int] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class DiscordWebhookRoute(DiscordWebhookRouteBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
