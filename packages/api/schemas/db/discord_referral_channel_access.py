from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class DiscordReferralChannelAccessBase(BaseModel):
    campaign_id: UUID
    referral_link_id: UUID
    discord_user_id: str
    discord_username: str
    guild_id: str
    private_channel_id: str
    invite_code: Optional[str] = None
    access_granted_at: Optional[datetime] = None
    role_assigned: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    is_active: Optional[bool] = None

class DiscordReferralChannelAccessCreate(DiscordReferralChannelAccessBase):
    pass

class DiscordReferralChannelAccessUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    referral_link_id: Optional[UUID] = None
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    guild_id: Optional[str] = None
    private_channel_id: Optional[str] = None
    invite_code: Optional[str] = None
    access_granted_at: Optional[datetime] = None
    role_assigned: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    is_active: Optional[bool] = None

class DiscordReferralChannelAccess(DiscordReferralChannelAccessBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
