from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from middleware.auth_middleware import AuthMiddleware
from routers import (
    admin,
    clients,
    status,
    referral,
    campaigns,
    health,
    auth,
    discord_bot,
    access_requests,
    analytics,
    templates,
    oauth
)
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables loaded

app = FastAPI(
    title="Virion Labs Unified API",
    description="The central API for all Virion Labs services.",
    version="0.1.0",
)

# Add middleware
app.add_middleware(AuthMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(admin.router)
app.include_router(clients.router)
app.include_router(status.router)
app.include_router(referral.router)
app.include_router(campaigns.router)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(discord_bot.router)
app.include_router(access_requests.router)
app.include_router(analytics.router)
app.include_router(templates.router)
app.include_router(oauth.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Virion-Labs API"}

@app.get("/.well-known/oauth-authorization-server")
@app.options("/.well-known/oauth-authorization-server")
async def oauth_authorization_server_metadata(request: Request):
    """OAuth 2.0 Authorization Server Metadata at root level."""
    # Use environment variable if available, otherwise construct from headers
    api_base_url = os.getenv("API_BASE_URL")
    
    if api_base_url:
        base_url = api_base_url
    else:
        # Use X-Forwarded headers for Cloud Run
        scheme = request.headers.get("x-forwarded-proto", "https")
        host = request.headers.get("x-forwarded-host") or request.headers.get("host", "localhost:8000")
        base_url = f"{scheme}://{host}"
    
    return {
        "issuer": f"{base_url}",
        "authorization_endpoint": f"{base_url}/api/oauth/authorize",
        "token_endpoint": f"{base_url}/api/oauth/token",
        "registration_endpoint": f"{base_url}/api/oauth/register",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code"],
        "code_challenge_methods_supported": ["S256"],
        "scopes_supported": ["mcp", "read", "write"]
    }
