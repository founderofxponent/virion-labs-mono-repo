from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

# Legacy Campaign schemas for backward compatibility
class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class Campaign(CampaignBase):
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    max_participants: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Campaign access request for API endpoints
class CampaignAccessRequest(BaseModel):
    reason: Optional[str] = None
    additional_info: Optional[str] = None

# Data Export schemas - business logic, not direct DB mappings
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
    format: ExportFormat
    campaign_ids: Optional[List[UUID]] = None
    guild_ids: Optional[List[str]] = None
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None
    include_pii: Optional[bool] = False
    filters: Optional[dict] = {}

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
    EXPIRED = "expired"

class DataExport(BaseModel):
    id: UUID
    export_type: ExportType
    format: ExportFormat
    status: DataExportStatus
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    record_count: Optional[int] = None
    error_message: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True