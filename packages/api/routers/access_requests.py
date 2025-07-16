from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from core.database import get_db
from services import access_request_service
from schemas.access_request import AccessRequestCreate

router = APIRouter(
    prefix="/api/access-requests",
    tags=["Access Requests"],
)

@router.post("/")
async def submit_access_request(
    request_data: AccessRequestCreate,
    db: Client = Depends(get_db)
):
    """
    Submit a new access request from the bot.
    """
    try:
        return access_request_service.create_access_request(db, request_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to submit access request")