from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify environment.
    """
    return {"status": "ok", "environment": settings.FASTAPI_ENV} 