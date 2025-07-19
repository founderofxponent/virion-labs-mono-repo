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
            "/health" # Alternative health check endpoint
        ]
        
        # Allow root path for health checks or welcome messages
        if request.url.path == "/":
            return await call_next(request)

        # Check for unprotected paths more robustly
        for path in unprotected_paths:
            if request.url.path.startswith(path):
                return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication credentials were not provided."},
            )

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authentication scheme")
        except ValueError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authentication credentials"},
            )

        try:
            user_response = await supabase_client.auth.get_user(token)
            
            if not user_response.user:
                 return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid token or user not found"},
                )

            request.state.user = user_response.user
        except Exception as e:
            return JSONResponse(
                status_code=401,
                content={"detail": f"Invalid token or expired token: {e}"},
            )

        return await call_next(request)


class AuthContext:
    def __init__(self, user_id: str, is_service: bool = False):
        self.user_id = user_id
        self.is_service = is_service


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
    
    # Check against environment variable or configured API key
    expected_api_key = os.getenv("API_KEY")
    if not expected_api_key or api_key != expected_api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    
    return AuthContext(user_id="service", is_service=True)


def require_any_auth(request: Request) -> AuthContext:
    """
    Require either user authentication (Bearer token) or service authentication (API key).
    Returns AuthContext if valid, raises HTTPException if not.
    """
    # Try API key first
    api_key = request.headers.get("X-API-Key")
    if api_key:
        expected_api_key = os.getenv("API_KEY")
        if expected_api_key and api_key == expected_api_key:
            return AuthContext(user_id="service", is_service=True)
    
    # Try Bearer token
    auth_header = request.headers.get("Authorization")
    if auth_header:
        try:
            scheme, token = auth_header.split()
            if scheme.lower() == "bearer":
                # Validate token with Supabase
                user_response = supabase_client.auth.get_user(token)
                if user_response.user:
                    return AuthContext(user_id=user_response.user.id, is_service=False)
        except Exception:
            pass
    
    raise HTTPException(
        status_code=401,
        detail="Authentication required (Bearer token or API key)"
    ) 