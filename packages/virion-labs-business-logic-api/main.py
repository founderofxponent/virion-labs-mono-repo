from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import health, operations, oauth, oauth_api
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
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
app.include_router(operations.router, prefix="/api/v1/operations", tags=["Operations"])
app.include_router(oauth.router, tags=["OAuth Discovery"]) # Root-level discovery
app.include_router(oauth_api.router, prefix="/api/oauth", tags=["OAuth Flow"]) # Prefixed flow endpoints


@app.get("/")
async def root():
    return {
        "message": "Virion Labs Unified Business Logic API",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.API_PORT)
