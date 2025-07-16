from fastapi import FastAPI
from routers import status, admin

app = FastAPI(
    title="Virion Labs Unified API",
    description="The central API for all Virion Labs services.",
    version="0.1.0",
)

app.include_router(status.router)
app.include_router(admin.router)
