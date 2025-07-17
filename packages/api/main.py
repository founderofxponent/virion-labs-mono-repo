from fastapi import FastAPI
from routers import admin, bot_campaigns, clients, status, referral, campaigns, health, auth, discord_bot, access_requests

app = FastAPI(
    title="Virion Labs Unified API",
    description="The central API for all Virion Labs services.",
    version="0.1.0",
)

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Virion-Labs API"}
