from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any, Dict, Union
from uuid import UUID
from enum import Enum


class CampaignCreate(BaseModel):
    client_id: UUID
    guild_id: str
    channel_id: Optional[str] = None
    campaign_name: str
    campaign_type: str
    referral_link_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    description: Optional[str] = None

class CampaignUpdate(BaseModel):
    client_id: Optional[UUID] = None
    guild_id: Optional[str] = None
    channel_id: Optional[str] = None
    campaign_name: Optional[str] = None
    campaign_type: Optional[str] = None
    referral_link_id: Optional[UUID] = None
    influencer_id: Optional[UUID] = None
    webhook_url: Optional[str] = None
    welcome_message: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    campaign_end_date: Optional[datetime] = None
    onboarding_flow: Optional[Union[dict, list]] = None

class CampaignStats(BaseModel):
    total_interactions: Optional[int] = None
    successful_onboardings: Optional[int] = None
    referral_conversions: Optional[int] = None
    commands_used: Optional[int] = None
    users_served: Optional[int] = None


class CampaignAccessRequest(BaseModel):
    reason: str
    additional_info: Optional[str] = None


class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"

class ExportType(str, Enum):
    CAMPAIGN_DATA = "campaign_data"
    USER_DATA = "user_data"
    ANALYTICS_DATA = "analytics_data"
    REFERRAL_DATA = "referral_data"
    ONBOARDING_DATA = "onboarding_data"

class DataExportRequest(BaseModel):
    export_type: ExportType
    format: ExportFormat = ExportFormat.CSV
    campaign_ids: Optional[List[UUID]] = None
    guild_ids: Optional[List[str]] = None
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    include_pii: bool = False

class DataExportResponse(BaseModel):
    success: bool
    message: str
    export_id: Optional[UUID] = None
    estimated_completion_time: Optional[datetime] = None
    download_url: Optional[str] = None

class DataExportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class DataExport(BaseModel):
    id: UUID
    export_type: ExportType
    format: ExportFormat
    status: DataExportStatus
    file_path: Optional[str] = None
    record_count: int
    expires_at: datetime
    created_at: datetime
    updated_at: datetime