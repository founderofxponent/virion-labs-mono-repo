from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal, Dict
from datetime import datetime

class CampaignExportStats(BaseModel):
    """
    Provides a summary of the data included in the export for a single campaign.
    """
    campaign_id: str
    campaign_name: str
    total_responses: int
    completed_responses: int

class OnboardingExportRequest(BaseModel):
    """
    Defines the request body for exporting campaign onboarding data.
    """
    select_mode: Literal["all", "multiple", "single"] = Field(
        ...,
        description="The selection mode for campaigns."
    )
    campaign_ids: Optional[List[str]] = Field(
        None,
        description="A list of campaign documentIds to export. Required if select_mode is 'multiple' or 'single'."
    )
    file_format: Literal["csv", "json"] = Field(
        "csv",
        description="The desired file format for the export."
    )
    date_range: Literal["7", "30", "90", "365", "all"] = Field(
        "all",
        description="The date range for the data to be exported."
    )

class OnboardingExportResponse(BaseModel):
    """
    Defines the successful response for an onboarding data export request.
    """
    download_url: str
    filename: str
    content_type: str
    size_bytes: int
    expires_at: datetime
    campaigns_summary: List[CampaignExportStats]

# --- Influencer Metrics Schemas ---

class CampaignContext(BaseModel):
    """Structured campaign context for dashboard compatibility."""
    campaign_name: str
    client_name: str

class InfluencerLinkMetrics(BaseModel):
    """
    Defines the structure for a single referral link with metrics in influencer analytics.
    """
    id: int
    documentId: str  # Added for dashboard compatibility
    title: str
    platform: str
    clicks: int = 0
    conversions: int = 0
    earnings: float = 0.0
    conversion_rate: float = 0.0
    referral_url: str
    original_url: str
    thumbnail_url: Optional[str] = None
    is_active: bool = True
    created_at: str
    expires_at: Optional[str] = None
    description: Optional[str] = None
    referral_code: str
    campaign_context: Optional[CampaignContext] = None
    last_conversion_at: Optional[str] = None  # Added for dashboard compatibility

class InfluencerMetricsResponse(BaseModel):
    """
    Defines the response structure for influencer-specific metrics endpoint.
    """
    total_links: int
    active_links: int
    total_clicks: int
    total_conversions: int
    total_earnings: float
    overall_conversion_rate: float
    links: List[InfluencerLinkMetrics]