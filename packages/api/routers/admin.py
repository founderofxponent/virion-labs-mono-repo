from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_supabase_client
from services import admin_service
from middleware.auth_middleware import AuthContext
from schemas.db.access_requests import AccessRequest, AccessRequestUpdate
from schemas.api.admin import AdminUserListResponse

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)

@router.get(
    "/access-requests", 
    response_model=List[AccessRequest], 
    operation_id="admin.list_access_requests",
    summary="[Admin] Retrieve a list of all user access requests for all campaigns."
)
async def list_access_requests(
    request: Request,
    db: Client = Depends(get_supabase_client)
):
    """
    Retrieves a list of all access requests. Requires API key authentication.
    """
    auth_context: AuthContext = request.state.auth
    if not auth_context.is_service_auth:
        raise HTTPException(status_code=403, detail="Service authentication required")
        
    return admin_service.get_access_requests(db)

@router.post(
    "/access-requests", 
    response_model=AccessRequest, 
    operation_id="admin.handle_access_request",
    summary="[Admin] Approve or deny a user's request to access a campaign."
)
async def handle_access_request(
    update: AccessRequestUpdate,
    request: Request,
    db: Client = Depends(get_supabase_client)
):
    """
    Approve or deny an access request. Requires API key authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
            
        updated_request = admin_service.update_access_request_status(
            db, request_id=update.request_id, status=update.action
        )
        return updated_request
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/users", 
    response_model=AdminUserListResponse, 
    operation_id="admin.get_all_users",
    summary="[Admin] Get a comprehensive list of all users, including their access requests and campaign data."
)
async def get_all_users(
    request: Request,
    db: Client = Depends(get_supabase_client)
):
    """
    Get all users in the system with their access requests and campaign info.
    Critical endpoint for Discord bot admin user management.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")

        result = admin_service.get_all_users(db)
        
        if not result.success:
            raise HTTPException(status_code=500, detail=result.message)
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve users: {e}") 