from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class LandingPageTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    campaign_types: Optional[List[str]] = None
    template_structure: Optional[Dict[str, Any]] = None
    customizable_fields: Optional[List[str]] = None
    default_offer_title: Optional[str] = None
    default_offer_description: Optional[str] = None
    default_offer_highlights: Optional[List[str]] = None
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