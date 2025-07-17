from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import admin_service
from middleware.auth_middleware import require_service_auth, AuthContext
from schemas.admin import AccessRequest, AccessRequestUpdate

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)

@router.get("/access-requests", response_model=List[AccessRequest])
async def list_access_requests(
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Retrieves a list of all access requests. Requires API key authentication.
    """
    # Require service authentication (API key only)
    auth_context = require_service_auth(request)
    return admin_service.get_access_requests(db)

@router.post("/access-requests", response_model=AccessRequest)
async def handle_access_request(
    update: AccessRequestUpdate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Approve or deny an access request. Requires API key authentication.
    """
    try:
        # Require service authentication (API key only)
        auth_context = require_service_auth(request)
        updated_request = admin_service.update_access_request_status(
            db, request_id=update.request_id, status=update.action
        )
        return updated_request
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) 