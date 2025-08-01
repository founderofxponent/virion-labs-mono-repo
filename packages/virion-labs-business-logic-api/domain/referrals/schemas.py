from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReferralBase(BaseModel):
    """Base model for a referral."""
    name: str
    email: str
    status: str
    source_platform: Optional[str] = None
    conversion_value: Optional[float] = 0.0

class ReferralCreate(ReferralBase):
    """Model for creating a new referral."""
    pass

class ReferralResponse(ReferralBase):
    """Full referral model for API responses."""
    id: int
    documentId: str
    created_at: datetime

    class Config:
        from_attributes = True