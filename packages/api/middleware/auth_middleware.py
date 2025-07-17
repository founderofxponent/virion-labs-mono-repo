"""Authentication middleware supporting both JWT and API key authentication."""

from fastapi import HTTPException, Request
from typing import Optional
from uuid import UUID

from services.auth_service import get_user_id_from_token
from services.api_key_service import is_valid_api_key_request, extract_api_key_from_header

class AuthContext:
    """Context object containing authentication information."""
    
    def __init__(self, auth_type: str, user_id: Optional[UUID] = None, api_key: Optional[str] = None):
        self.auth_type = auth_type  # "jwt" or "api_key"
        self.user_id = user_id
        self.api_key = api_key
    
    @property
    def is_user_auth(self) -> bool:
        """Check if this is user authentication (JWT)."""
        return self.auth_type == "jwt"
    
    @property
    def is_service_auth(self) -> bool:
        """Check if this is service authentication (API key)."""
        return self.auth_type == "api_key"

def get_authorization_header(request: Request) -> Optional[str]:
    """Extract Authorization header from request."""
    return request.headers.get("Authorization")

def authenticate_request(request: Request, require_auth: bool = True) -> Optional[AuthContext]:
    """
    Authenticate a request using either JWT or API key.
    
    Args:
        request: The FastAPI request object
        require_auth: Whether authentication is required
        
    Returns:
        AuthContext if authenticated, None if not required and not provided
        
    Raises:
        HTTPException: If authentication is required but invalid/missing
    """
    auth_header = get_authorization_header(request)
    
    if not auth_header:
        if require_auth:
            raise HTTPException(status_code=401, detail="Authorization header required")
        return None
    
    # Try API key authentication first
    if is_valid_api_key_request(auth_header):
        api_key = extract_api_key_from_header(auth_header)
        return AuthContext(auth_type="api_key", api_key=api_key)
    
    # Try JWT authentication
    try:
        # Extract token from "Bearer <token>"
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            if require_auth:
                raise HTTPException(status_code=401, detail="Invalid authorization header format")
            return None
        
        token = parts[1]
        user_id = get_user_id_from_token(token)
        return AuthContext(auth_type="jwt", user_id=user_id)
        
    except ValueError as e:
        if require_auth:
            raise HTTPException(status_code=401, detail=str(e))
        return None

def require_user_auth(request: Request) -> AuthContext:
    """
    Require user authentication (JWT only).
    
    Args:
        request: The FastAPI request object
        
    Returns:
        AuthContext with user information
        
    Raises:
        HTTPException: If not authenticated or not a user
    """
    auth_context = authenticate_request(request, require_auth=True)
    
    if not auth_context.is_user_auth:
        raise HTTPException(status_code=403, detail="User authentication required")
    
    return auth_context

def require_service_auth(request: Request) -> AuthContext:
    """
    Require service authentication (API key only).
    
    Args:
        request: The FastAPI request object
        
    Returns:
        AuthContext with service information
        
    Raises:
        HTTPException: If not authenticated or not a service
    """
    auth_context = authenticate_request(request, require_auth=True)
    
    if not auth_context.is_service_auth:
        raise HTTPException(status_code=403, detail="Service authentication required")
    
    return auth_context

def require_any_auth(request: Request) -> AuthContext:
    """
    Require any authentication (JWT or API key).
    
    Args:
        request: The FastAPI request object
        
    Returns:
        AuthContext with authentication information
        
    Raises:
        HTTPException: If not authenticated
    """
    return authenticate_request(request, require_auth=True)