from fastapi import FastAPI, Depends
from middleware.auth_middleware import AuthMiddleware
from routers import (
    admin,
    bot_campaigns,
    clients,
    status,
    referral,
    campaigns,
    health,
    auth,
    discord_bot,
    access_requests,
    analytics,
    templates
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Virion Labs Unified API",
    description="The central API for all Virion Labs services.",
    version="0.1.0",
)

# Add middleware
app.add_middleware(AuthMiddleware)


# Include routers
app.include_router(admin.router)
app.include_router(bot_campaigns.router)
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


@app.get("/")
def read_root():
    return {"message": "Welcome to the Virion-Labs API"}
