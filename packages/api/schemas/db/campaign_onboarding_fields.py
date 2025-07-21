from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CampaignOnboardingFieldBase(BaseModel):
    campaign_id: UUID
    field_key: str
    field_label: str
    field_type: str
    field_placeholder: Optional[str] = None
    field_description: Optional[str] = None
    field_options: list
    is_required: int
    is_enabled: int
    sort_order: int
    validation_rules: dict
    discord_integration: dict

class CampaignOnboardingFieldCreate(CampaignOnboardingFieldBase):
    pass

class CampaignOnboardingFieldUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    field_key: Optional[str] = None
    field_label: Optional[str] = None
    field_type: Optional[str] = None
    field_placeholder: Optional[str] = None
    field_description: Optional[str] = None
    field_options: Optional[list] = None
    is_required: Optional[int] = None
    is_enabled: Optional[int] = None
    sort_order: Optional[int] = None
    validation_rules: Optional[dict] = None
    discord_integration: Optional[dict] = None

class CampaignOnboardingField(CampaignOnboardingFieldBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
