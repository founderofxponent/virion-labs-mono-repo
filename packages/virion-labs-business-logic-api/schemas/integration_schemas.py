from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

# Discord Integration Schemas

class Campaign(BaseModel):
    id: int
    campaign_name: str
    description: Optional[str] = None
    channel_id: Optional[str] = None

class GetCampaignsResponse(BaseModel):
    campaigns: List[Campaign]

class RequestAccessRequest(BaseModel):
    user_id: str
    user_tag: str
    guild_id: str
    email: EmailStr
    name: str

class RequestAccessResponse(BaseModel):
    success: bool
    message: str

class HasVerifiedRoleResponse(BaseModel):
    has_role: bool