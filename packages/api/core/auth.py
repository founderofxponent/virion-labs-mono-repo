from dataclasses import dataclass
from typing import Optional
from uuid import UUID
from fastapi import Request, HTTPException

@dataclass
class AuthContext:
    is_authenticated: bool = False
    is_user_auth: bool = False
    is_api_key_auth: bool = False

    # For user authentication
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    user_roles: Optional[list[str]] = None

    # For API key authentication
    api_key_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    permissions: Optional[list[str]] = None

def get_current_user_id(request: Request) -> UUID:
    """
    Get the current user ID from the request auth context.
    Raises HTTPException if not authenticated as a user.
    """
    auth_context: AuthContext = getattr(request.state, 'auth', None)
    if not auth_context or not auth_context.is_user_auth:
        raise HTTPException(status_code=403, detail="User authentication required")
    
    if not auth_context.user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication context")
    
    return auth_context.user_id 