from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class CampaignLandingPageBase(BaseModel):
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

class CampaignLandingPageCreate(CampaignLandingPageBase):
    campaign: Any # Can be documentId string or ID int

class CampaignLandingPageUpdate(CampaignLandingPageBase):
    pass

class CampaignOnboardingFieldBase(BaseModel):
    field_key: Optional[str] = None
    field_label: Optional[str] = None
    field_type: Optional[str] = None
    field_placeholder: Optional[str] = None
    field_description: Optional[str] = None
    field_options: Optional[Dict[str, Any]] = None
    is_required: Optional[bool] = None
    is_enabled: Optional[bool] = None
    sort_order: Optional[int] = None
    validation_rules: Optional[Dict[str, Any]] = None
    discord_integration: Optional[Dict[str, Any]] = None

class CampaignOnboardingFieldCreate(CampaignOnboardingFieldBase):
    field_key: str
    field_label: str
    field_type: str
    campaign: Any # Can be documentId string or ID int

class CampaignOnboardingFieldUpdate(CampaignOnboardingFieldBase):
    pass