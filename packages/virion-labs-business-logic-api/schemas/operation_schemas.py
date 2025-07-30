from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

# --- Base Models ---

class BusinessContext(BaseModel):
    recommendation: str
    is_active: bool

class EnrichedClient(BaseModel):
    id: int
    attributes: Dict[str, Any]
    business_context: BusinessContext

# --- Client List Operation ---

class ClientListResponse(BaseModel):
    """
    Defines the structure for the response of the client list operation.
    """
    clients: List[EnrichedClient]
    total_count: int

# --- Client Create Operation ---

class ClientData(BaseModel):
    name: str
    contact_email: EmailStr
    industry: Optional[str] = None

class SetupOptions(BaseModel):
    create_default_settings: bool = True
    enable_analytics: bool = True
    send_welcome_email: bool = True

class ClientCreateRequest(BaseModel):
    client_data: ClientData
    setup_options: SetupOptions

class ClientCreateResponse(BaseModel):
    client: Dict[str, Any]
    business_context: BusinessContext
    default_settings_created: Optional[bool] = None
    analytics_enabled: Optional[bool] = None
    welcome_email_sent: Optional[bool] = None

# --- Client Update Operation ---

class ClientUpdateRequest(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    industry: Optional[str] = None
    client_status: Optional[str] = None

# --- Campaign List Operation ---

class CampaignListResponse(BaseModel):
    """
    Defines the structure for the response of the campaign list operation.
    """
    campaigns: List[Dict[str, Any]]
    total_count: int
    page: int
    limit: int

# --- Campaign Update Operation ---

class CampaignUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[float] = None
    duration_days: Optional[int] = None
