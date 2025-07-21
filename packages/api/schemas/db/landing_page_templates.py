from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class LandingPageTemplateBase(BaseModel):
    template_id: str
    name: str
    description: str
    preview_image_url: str
    campaign_types: list
    category: str
    template_structure: dict
    default_content: dict
    customizable_fields: list
    default_offer_title: str
    default_offer_description: str
    default_offer_highlights: list
    default_offer_value: str
    default_hero_image_url: Optional[str] = None
    default_video_url: Optional[str] = None
    default_what_you_get: str
    default_how_it_works: str
    default_requirements: str
    default_support_info: str
    color_scheme: dict
    layout_config: dict
    is_active: bool
    is_default: int
    created_by: Optional[str] = None

class LandingPageTemplateCreate(LandingPageTemplateBase):
    pass

class LandingPageTemplateUpdate(BaseModel):
    template_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    preview_image_url: Optional[str] = None
    campaign_types: Optional[list] = None
    category: Optional[str] = None
    template_structure: Optional[dict] = None
    default_content: Optional[dict] = None
    customizable_fields: Optional[list] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[list] = None
    default_offer_value: Optional[str] = None
    default_hero_image_url: Optional[str] = None
    default_video_url: Optional[str] = None
    default_what_you_get: Optional[str] = None
    default_how_it_works: Optional[str] = None
    default_requirements: Optional[str] = None
    default_support_info: Optional[str] = None
    color_scheme: Optional[dict] = None
    layout_config: Optional[dict] = None
    is_active: Optional[bool] = None
    is_default: Optional[int] = None
    created_by: Optional[str] = None

class LandingPageTemplate(LandingPageTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
