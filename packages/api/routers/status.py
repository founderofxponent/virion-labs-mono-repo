from fastapi import APIRouter

from schemas.api.common import HealthResponse

router = APIRouter(
    prefix="/status",
    tags=["Status"],
)

@router.get("/health", response_model=HealthResponse, operation_id="status.health")
async def health_check():
    """
    Health check endpoint to confirm the API is running.
    """
    return HealthResponse(status="ok") 