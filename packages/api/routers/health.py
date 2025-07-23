from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get(
    "/health", 
    tags=["Health"], 
    operation_id="health.check",
    summary="[Health] Perform a health check of the API and return the current environment."
)
async def health_check():
    """
    Health check endpoint to verify environment.
    """
    return {"status": "ok", "environment": settings.FASTAPI_ENV} 