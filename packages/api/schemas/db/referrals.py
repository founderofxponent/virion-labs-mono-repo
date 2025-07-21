from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class ReferralBase(BaseModel):
    influencer_id: UUID
    referral_link_id: UUID
    referred_user_id: Optional[UUID] = None
    name: str
    email: Optional[EmailStr] = None
    discord_id: Optional[str] = None
    age: Optional[int] = None
    status: str
    source_platform: str
    conversion_value: Optional[float] = None
    metadata: Optional[dict] = None

class ReferralCreate(ReferralBase):
    pass

class ReferralUpdate(BaseModel):
    influencer_id: Optional[UUID] = None
    referral_link_id: Optional[UUID] = None
    referred_user_id: Optional[UUID] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    discord_id: Optional[str] = None
    age: Optional[int] = None
    status: Optional[str] = None
    source_platform: Optional[str] = None
    conversion_value: Optional[float] = None
    metadata: Optional[dict] = None

class Referral(ReferralBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
