from fastapi import APIRouter, Request
from starlette.responses import JSONResponse
import uuid
import secrets
from datetime import datetime

router = APIRouter()

@router.post("/register")
async def dynamic_client_registration(request: Request):
    """
    Placeholder for Dynamic Client Registration (RFC 7591).
    This provides a valid response to allow the MCP Server to start.
    """
    client_id = f"mcp_client_{uuid.uuid4().hex[:16]}"
    client_secret = secrets.token_urlsafe(32)
    
    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "client_id_issued_at": int(datetime.utcnow().timestamp()),
        "client_secret_expires_at": 0,
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "redirect_uris": ["http://localhost:3000/auth/callback"],
        "token_endpoint_auth_method": "client_secret_basic",
        "scope": "mcp"
    }

@router.get("/.well-known/oauth-authorization-server")
async def get_oauth_server_metadata():
    """
    Provides OAuth server metadata to clients like the MCP Server.
    This is a standard discovery endpoint.
    """
    # In a real implementation, these URLs would be dynamically generated
    # based on the request's host and the API's routing structure.
    base_url = "http://localhost:8000" # Assuming the API runs here
    
    return JSONResponse({
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}/api/oauth/authorize",
        "token_endpoint": f"{base_url}/api/oauth/token",
        "registration_endpoint": f"{base_url}/register",
        "scopes_supported": ["mcp", "openid", "profile", "email"],
        "response_types_supported": ["code", "token"],
        "grant_types_supported": ["authorization_code", "refresh_token", "client_credentials"],
        "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
        "code_challenge_methods_supported": ["S256", "plain"]
    })
