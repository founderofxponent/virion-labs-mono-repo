from fastapi import APIRouter, HTTPException
from typing import Optional
from services.client_service import client_service
from schemas.operation_schemas import ClientListResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/test")
async def test_endpoint():
    return {"message": "operations router is working"}

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
