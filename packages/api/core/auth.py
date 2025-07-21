from dataclasses import dataclass
from typing import Optional
from uuid import UUID

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