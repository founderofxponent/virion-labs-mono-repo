from fastapi import APIRouter

router = APIRouter(
    prefix="/status",
    tags=["Status"],
)

@router.get("/health")
async def health_check():
    """
    Health check endpoint to confirm the API is running.
    """
    return {"status": "ok"} 