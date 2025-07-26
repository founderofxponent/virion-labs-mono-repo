from fastapi import APIRouter, HTTPException
from typing import Optional
from services.client_service import client_service
from schemas.operation_schemas import ClientListResponse, ClientCreateRequest, ClientCreateResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/client/create", response_model=ClientCreateResponse)
async def create_client_operation(request: ClientCreateRequest):
    """
    Business operation for client creation with setup options.
    """
    try:
        result = await client_service.create_client_operation(
            client_data=request.client_data.model_dump(),
            setup_options=request.setup_options.model_dump()
        )
        return ClientCreateResponse(**result)
    except Exception as e:
        logger.error(f"Client creation operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/list", response_model=ClientListResponse)
async def list_clients_operation(status: Optional[str] = None):
    """
    Business operation for listing clients with optional filtering.
    """
    try:
        logger.info(f"Router: Received request to list clients with status: {status}")
        filters = {}
        if status:
            filters["filters[status][$eq]"] = status

        result = await client_service.list_clients_operation(filters)
        return ClientListResponse(**result)

    except Exception as e:
        logger.error(f"Client list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
