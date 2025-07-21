from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class DiscordInviteLinkBase(BaseModel):
    campaign_id: UUID
    referral_link_id: Optional[UUID] = None
    discord_invite_code: str
    discord_invite_url: str
    guild_id: str
    channel_id: Optional[str] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    uses_count: Optional[int] = None
    is_active: Optional[bool] = None

class DiscordInviteLinkCreate(DiscordInviteLinkBase):
    pass

class DiscordInviteLinkUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    referral_link_id: Optional[UUID] = None
    discord_invite_code: Optional[str] = None
    discord_invite_url: Optional[str] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    uses_count: Optional[int] = None
    is_active: Optional[bool] = None

class DiscordInviteLink(DiscordInviteLinkBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
