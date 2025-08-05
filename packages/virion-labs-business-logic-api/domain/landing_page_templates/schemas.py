from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LandingPageTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    campaign_types: Optional[List[str]] = None
    template_structure: Optional[Dict[str, Any]] = None
    default_content: Optional[Dict[str, Any]] = None
    customizable_fields: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[List[str]] = None
    default_offer_value: Optional[str] = None
    default_hero_image_url: Optional[str] = None
    default_video_url: Optional[str] = None
    default_what_you_get: Optional[str] = None
    default_how_it_works: Optional[str] = None
    default_requirements: Optional[str] = None
    default_support_info: Optional[str] = None
    default_product_images: Optional[List[str]] = None
    color_scheme: Optional[Dict[str, Any]] = None
    layout_config: Optional[Dict[str, Any]] = None
    preview_image_url: Optional[str] = None
    is_active: Optional[bool] = True
    is_default: Optional[bool] = False

class LandingPageTemplateCreate(LandingPageTemplateBase):
    pass

class LandingPageTemplateUpdate(LandingPageTemplateBase):
    name: Optional[str] = None # All fields are optional for update

class LandingPageTemplateResponse(LandingPageTemplateBase):
    id: int
    documentId: str