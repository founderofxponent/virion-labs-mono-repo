from pydantic import BaseModel, Field
from typing import List, Optional, Literal
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