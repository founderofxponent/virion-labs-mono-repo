"""API Key authentication service for service-to-service communication."""

from typing import Optional
from core.config import settings

def validate_api_key(api_key: str) -> bool:
    """
    Validate an API key for service-to-service authentication.
    
    Args:
        api_key: The API key to validate
        
    Returns:
        True if the API key is valid, False otherwise
    """
    if not settings.INTERNAL_API_KEY:
        # If no internal API key is configured, reject all API key auth
        return False
    
    return api_key == settings.INTERNAL_API_KEY

def extract_api_key_from_header(authorization_header: Optional[str]) -> Optional[str]:
    """
    Extract API key from Authorization header.
    
    Expected format: "Bearer <api_key>"
    
    Args:
        authorization_header: The Authorization header value
        
    Returns:
        The API key if found, None otherwise
    """
    if not authorization_header:
        return None
    
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]

def is_valid_api_key_request(authorization_header: Optional[str]) -> bool:
    """
    Check if a request has a valid API key.
    
    Args:
        authorization_header: The Authorization header value
        
    Returns:
        True if the request has a valid API key, False otherwise
    """
    api_key = extract_api_key_from_header(authorization_header)
    if not api_key:
        return False
    
    return validate_api_key(api_key)