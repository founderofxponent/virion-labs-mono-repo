from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from services.client_service import client_service
from schemas.operation_schemas import ClientListResponse, ClientCreateRequest, ClientCreateResponse, ClientUpdateRequest
from core.auth import get_current_user, StrapiUser
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/client/create", response_model=ClientCreateResponse)
async def create_client_operation(request: ClientCreateRequest, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for client creation with setup options.
    (Protected)
    """
    try:
        result = await client_service.create_client_operation(
            client_data=request.client_data.model_dump(),
            setup_options=request.setup_options.model_dump(),
            current_user=user
        )
        return ClientCreateResponse(**result)
    except Exception as e:
        logger.error(f"Client creation operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/client/update/{document_id}")
async def update_client_operation(document_id: str, request: ClientUpdateRequest, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for updating a client.
    (Protected)
    """
    try:
        # Exclude unset fields so we only update what's provided
        updates = request.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No update data provided.")
            
        result = await client_service.update_client_operation(document_id, updates, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Client update operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/get/{document_id}")
async def get_client_operation(document_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for fetching a single client.
    (Protected)
    """
    try:
        result = await client_service.get_client_operation(document_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Client get operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/client/delete/{document_id}")
async def delete_client_operation(document_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for deleting a client (soft delete).
    (Protected)
    """
    try:
        result = await client_service.delete_client_operation(document_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Client delete operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/list", response_model=ClientListResponse)
async def list_clients_operation(status: Optional[str] = None, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for listing clients with optional filtering.
    (Protected)
    """
    try:
        logger.info(f"Router: Received request to list clients with status: {status}")
        filters = {}
        if status:
            filters["filters[status][$eq]"] = status

        result = await client_service.list_clients_operation(filters, current_user=user)
        return ClientListResponse(**result)

    except Exception as e:
        logger.error(f"Client list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
