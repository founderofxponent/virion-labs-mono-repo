from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class CampaignLandingPageUpdate(BaseModel):
    offer_title: Optional[str] = None
    offer_description: Optional[str] = None
    offer_highlights: Optional[List[Any]] = None
    offer_value: Optional[str] = None
    offer_expiry_date: Optional[str] = None
    hero_image_url: Optional[Any] = None
    product_images: Optional[List[Any]] = None
    video_url: Optional[str] = None
    what_you_get: Optional[str] = None
    how_it_works: Optional[str] = None
    requirements: Optional[str] = None
    support_info: Optional[str] = None
    inherited_from_template: Optional[bool] = None
    landing_page_template: Optional[Any] = None
    campaign: Optional[Any] = None