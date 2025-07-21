from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class CampaignLandingPageBase(BaseModel):
    campaign_id: UUID
    offer_title: str
    offer_description: str
    offer_highlights: list
    offer_value: str
    offer_expiry_date: Optional[str] = None
    hero_image_url: Optional[str] = None
    product_images: Optional[str] = None
    video_url: Optional[str] = None
    what_you_get: str
    how_it_works: str
    requirements: str
    support_info: str
    landing_page_template_id: str
    inherited_from_template: int

class CampaignLandingPageCreate(CampaignLandingPageBase):
    pass

class CampaignLandingPageUpdate(BaseModel):
    campaign_id: Optional[UUID] = None
    offer_title: Optional[str] = None
    offer_description: Optional[str] = None
    offer_highlights: Optional[list] = None
    offer_value: Optional[str] = None
    offer_expiry_date: Optional[str] = None
    hero_image_url: Optional[str] = None
    product_images: Optional[str] = None
    video_url: Optional[str] = None
    what_you_get: Optional[str] = None
    how_it_works: Optional[str] = None
    requirements: Optional[str] = None
    support_info: Optional[str] = None
    landing_page_template_id: Optional[str] = None
    inherited_from_template: Optional[int] = None

class CampaignLandingPage(CampaignLandingPageBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
