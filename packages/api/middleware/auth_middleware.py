from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from core.database import supabase_client # Direct import for middleware
from fastapi import HTTPException
from typing import Optional
import jwt
import os

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # These paths can be accessed without authentication
        unprotected_paths = [
            "/docs", 
            "/openapi.json", 
            "/api/auth/google/login", 
            "/api/auth/google/callback", 
            "/api/health",
            "/api/auth/login", # Also allow basic login
            "/api/auth/signup", # Also allow basic signup
            "/status/health", # Health check endpoint
            "/health", # Alternative health check endpoint
            "/oauth", # OAuth endpoints for MCP Inspector (legacy)
            "/api/oauth", # OAuth endpoints for MCP Inspector (new path)
            "/.well-known", # OAuth discovery endpoints
        ]
        
        # Allow root path for health checks or welcome messages
        if request.url.path == "/":
            return await call_next(request)

        # Check for unprotected paths more robustly
        for path in unprotected_paths:
            if request.url.path.startswith(path):
                return await call_next(request)

        # Try to authenticate with either Bearer token or API key
        try:
            auth_context = require_any_auth(request)
            request.state.auth = auth_context
            return await call_next(request)
        except HTTPException as e:
            # If require_any_auth fails, it raises an HTTPException.
            # We return a standard 401 response.
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )


class AuthContext:
    def __init__(self, user_id: Optional[str] = None, is_user_auth: bool = False, is_service_auth: bool = False):
        if not user_id:
            raise ValueError("user_id must be provided for AuthContext")
        self.user_id = user_id
        self.is_user_auth = is_user_auth
        self.is_service_auth = is_service_auth


def require_service_auth(request: Request) -> AuthContext:
    """
    Require service authentication via API key.
    Returns AuthContext if valid, raises HTTPException if not.
    """
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required for this endpoint"
        )
    
    # Check against the dedicated MCP API token
    expected_api_key = os.getenv("MCP_API_TOKEN")
    if not expected_api_key or api_key != expected_api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    
    return AuthContext(user_id="service", is_service_auth=True)


def require_any_auth(request: Request) -> AuthContext:
    """
    Require either user authentication (Bearer token) or service authentication (API key).
    Returns AuthContext if valid, raises HTTPException if not.
    """
    # Try API key first
    api_key = request.headers.get("X-API-Key")
    if api_key:
        expected_api_key = os.getenv("MCP_API_TOKEN")
        if expected_api_key and api_key == expected_api_key:
            return AuthContext(user_id="service", is_service_auth=True)
    
    # Try Bearer token
    auth_header = request.headers.get("Authorization")
    if auth_header:
        try:
            scheme, token = auth_header.split()
            if scheme.lower() == "bearer":
                # Validate token with Supabase
                user_response = supabase_client.auth.get_user(token)
                if user_response.user:
                    return AuthContext(user_id=str(user_response.user.id), is_user_auth=True)
        except Exception:
            pass
    
    raise HTTPException(
        status_code=401,
        detail="Authentication required (Bearer token or API key)"
    ) 