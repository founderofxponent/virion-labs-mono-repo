from pydantic import BaseModel
from typing import List, Dict, Any

class BusinessContext(BaseModel):
    recommendation: str
    is_active: bool

class EnrichedClient(BaseModel):
    id: int
    attributes: Dict[str, Any]
    business_context: BusinessContext

class ClientListResponse(BaseModel):
    """
    Defines the structure for the response of the client list operation.
    """
    clients: List[EnrichedClient]
    total_count: int
