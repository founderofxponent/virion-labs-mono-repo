from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID

class OnboardingStart(BaseModel):
    discord_user_id: str
    discord_username: str
    discord_guild_id: str
    campaign_id: Optional[UUID] = None

class OnboardingModal(BaseModel):
    discord_user_id: str
    full_name: str
    email: EmailStr
    additional_data: Optional[Dict[str, Any]] = None

class OnboardingSession(BaseModel):
    discord_user_id: str
    status: str
    current_step: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OnboardingComplete(BaseModel):
    discord_user_id: str
    final_data: Optional[Dict[str, Any]] = None

class AccessRequestCreate(BaseModel):
    discord_user_id: str
    discord_username: str
    discord_guild_id: str
    full_name: str
    email: EmailStr
    verified_role_id: str
    additional_data: Optional[Dict[str, Any]] = None

class DiscordConfig(BaseModel):
    guild_id: str
    bot_token: Optional[str] = None
    verified_role_id: Optional[str] = None
    onboarding_channel_id: Optional[str] = None
    welcome_message: Optional[str] = None
    config_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class DiscordInviteContext(BaseModel):
    invite_code: str
    campaign_id: Optional[UUID] = None
    campaign_name: Optional[str] = None
    guild_id: str
    guild_name: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class DiscordRoleAssignment(BaseModel):
    role_id: str
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None