from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class DiscordReferralInteractionBase(BaseModel):
    guild_campaign_id: UUID
    discord_user_id: str
    discord_username: str
    message_id: str
    channel_id: Optional[str] = None
    referral_link_id: Optional[UUID] = None
    referral_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    interaction_type: str
    message_content: Optional[str] = None
    bot_response: Optional[str] = None
    onboarding_step: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    referral_code_provided: Optional[str] = None
    response_time_ms: Optional[int] = None
    sentiment_score: Optional[float] = None

class DiscordReferralInteractionCreate(DiscordReferralInteractionBase):
    pass

class DiscordReferralInteractionUpdate(BaseModel):
    guild_campaign_id: Optional[UUID] = None
    discord_user_id: Optional[str] = None
    discord_username: Optional[str] = None
    message_id: Optional[str] = None
    channel_id: Optional[str] = None
    referral_link_id: Optional[UUID] = None
    referral_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    interaction_type: Optional[str] = None
    message_content: Optional[str] = None
    bot_response: Optional[str] = None
    onboarding_step: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    referral_code_provided: Optional[str] = None
    response_time_ms: Optional[int] = None
    sentiment_score: Optional[float] = None

class DiscordReferralInteraction(DiscordReferralInteractionBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
