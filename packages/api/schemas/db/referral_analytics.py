from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class ReferralAnalyticBase(BaseModel):
    link_id: UUID
    event_type: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    referrer: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    conversion_value: Optional[float] = None
    metadata: Optional[dict] = None

class ReferralAnalyticCreate(ReferralAnalyticBase):
    pass

class ReferralAnalyticUpdate(BaseModel):
    link_id: Optional[UUID] = None
    event_type: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    referrer: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    conversion_value: Optional[float] = None
    metadata: Optional[dict] = None

class ReferralAnalytic(ReferralAnalyticBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
