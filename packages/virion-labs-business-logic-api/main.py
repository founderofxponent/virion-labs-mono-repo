from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
from routers import health, operations, auth, users, integrations, influencer, admin, analytics, tracking
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler('api.log')  # File output
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Unified Business Logic API for the Virion Labs Platform"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # WARNING: For development only.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Platform"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(operations.router, prefix="/api/v1/operations", tags=["Operations"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["Integrations"])
app.include_router(influencer.router, prefix="/api/v1/influencer", tags=["Influencer"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(tracking.router, prefix="/api/v1/tracking", tags=["Tracking"])

# Mount static files directory for exports
app.mount("/exports", StaticFiles(directory="temp_exports"), name="exports")


@app.get("/")
async def root():
    return {
        "message": "Virion Labs Unified Business Logic API",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }

@app.get("/.well-known/oauth-authorization-server", tags=["OAuth Discovery"])
async def get_oauth_server_metadata():
    """
    Provides OAuth 2.0 Authorization Server Metadata.
    This tells clients how to interact with our new auth flow.
    """
    base_url = "http://localhost:8000" # Should be from settings
    return {
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}/api/auth/login/google",
        "token_endpoint": f"{base_url}/api/auth/token", # Point to the new token endpoint
        "registration_endpoint": f"{base_url}/api/auth/register",
        "response_types_supported": ["code"], # We now properly support the 'code' flow
        "grant_types_supported": ["authorization_code"],
        "scopes_supported": ["openid", "profile", "email"],
        "code_challenge_methods_supported": ["S256"],
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.API_PORT)
