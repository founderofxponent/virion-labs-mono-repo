from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class ReferralLinkBase(BaseModel):
    influencer_id: UUID
    title: str
    description: Optional[str] = None
    platform: str
    original_url: str
    referral_code: str
    referral_url: str
    thumbnail_url: Optional[str] = None
    clicks: int
    earnings: int
    is_active: bool
    expires_at: Optional[str] = None
    campaign_id: UUID
    discord_invite_url: Optional[str] = None
    discord_guild_id: Optional[str] = None
    redirect_to_discord: bool
    landing_page_enabled: bool
    conversions: int
    last_conversion_at: Optional[str] = None
    private_channel_id: Optional[str] = None
    access_role_id: Optional[str] = None
    custom_invite_code: Optional[str] = None
    metadata: dict
    conversion_rate: Optional[str] = None

class ReferralLinkCreate(ReferralLinkBase):
    pass

class ReferralLinkUpdate(BaseModel):
    influencer_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    platform: Optional[str] = None
    original_url: Optional[str] = None
    referral_code: Optional[str] = None
    referral_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    clicks: Optional[int] = None
    earnings: Optional[int] = None
    is_active: Optional[bool] = None
    expires_at: Optional[str] = None
    campaign_id: Optional[UUID] = None
    discord_invite_url: Optional[str] = None
    discord_guild_id: Optional[str] = None
    redirect_to_discord: Optional[bool] = None
    landing_page_enabled: Optional[bool] = None
    conversions: Optional[int] = None
    last_conversion_at: Optional[str] = None
    private_channel_id: Optional[str] = None
    access_role_id: Optional[str] = None
    custom_invite_code: Optional[str] = None
    metadata: Optional[dict] = None
    conversion_rate: Optional[str] = None

class ReferralLink(ReferralLinkBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
