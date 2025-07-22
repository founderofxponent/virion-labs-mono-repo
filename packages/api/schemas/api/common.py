from pydantic import BaseModel
from typing import Optional, Dict, Any

class MessageResponse(BaseModel):
    """
    Standard response model for endpoints that return simple success/error messages.
    """
    message: str
    success: bool = True

class HealthResponse(BaseModel):
    """
    Health check response model.
    """
    status: str
    timestamp: Optional[str] = None
    version: Optional[str] = None
    uptime: Optional[str] = None

class ErrorResponse(BaseModel):
    """
    Standard error response model.
    """
    error: str
    detail: Optional[str] = None
    status_code: int