from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CampaignTemplateBase(BaseModel):
    name: str
    description: str
    campaign_type: str
    template_config: dict
    is_default: int
    created_by: Optional[str] = None
    category: str
    default_landing_page_id: UUID

class CampaignTemplateCreate(CampaignTemplateBase):
    pass

class CampaignTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[str] = None
    template_config: Optional[dict] = None
    is_default: Optional[int] = None
    created_by: Optional[str] = None
    category: Optional[str] = None
    default_landing_page_id: Optional[UUID] = None

class CampaignTemplate(CampaignTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
