from fastapi import APIRouter
from core.config import settings

router = APIRouter()

@router.get("/status/health")
async def health_check():
    """
    Checks the health of the service.
    """
    return {
        "status": "healthy",
        "service": "unified-business-logic-api",
        "version": settings.API_VERSION
    }
