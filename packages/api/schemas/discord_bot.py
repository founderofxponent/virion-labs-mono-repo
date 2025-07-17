from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID

class OnboardingStart(BaseModel):
    discord_user_id: str
    discord_username: str
    guild_id: str
    campaign_id: UUID

class OnboardingModal(BaseModel):
    discord_user_id: str
    campaign_id: UUID
    responses: Dict[str, Any]

class OnboardingSession(BaseModel):
    discord_user_id: str
    campaign_id: UUID
    status: str
    current_step: int
    responses: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OnboardingComplete(BaseModel):
    discord_user_id: str
    campaign_id: UUID

class AccessRequestCreate(BaseModel):
    discord_user_id: str
    discord_username: str
    discord_guild_id: str
    full_name: str
    email: EmailStr
    verified_role_id: str

class DiscordConfig(BaseModel):
    guild_id: str
    campaign_name: str
    welcome_message: Optional[str] = None
    onboarding_flow: Optional[list] = []

    class Config:
        from_attributes = True

class DiscordInviteContext(BaseModel):
    invite_code: str
    campaign_id: UUID
    campaign_name: str
    guild_id: str

    class Config:
        from_attributes = True

class DiscordRoleAssignment(BaseModel):
    role_id: str
    reason: Optional[str] = None