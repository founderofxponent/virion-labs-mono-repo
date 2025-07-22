from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import client_service
from middleware.auth_middleware import AuthContext
from schemas.db.clients import Client, ClientCreate, ClientUpdate
from schemas.api.common import MessageResponse

router = APIRouter(
    prefix="/api/clients",
    tags=["Clients"],
)

@router.get("/", response_model=List[Client], operation_id="clients.list")
async def list_clients(
    request: Request,
    db: Client = Depends(get_db)
):
    """
    List all clients. Supports both JWT and API key authentication.
    """
    auth_context: AuthContext = request.state.auth
    return client_service.get_all_clients(db)

@router.post("/", response_model=Client, operation_id="clients.create")
async def create_client(
    client_data: ClientCreate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Create a new client. Supports both JWT and API key authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        return client_service.create_client(db, client_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create client")

@router.get("/{client_id}", response_model=Client, operation_id="clients.get")
async def get_client(
    client_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get client details by ID. Supports both JWT and API key authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        return client_service.get_client_by_id(db, client_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve client")

@router.patch("/{client_id}", response_model=Client, operation_id="clients.update")
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Update client details. Supports both JWT and API key authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        return client_service.update_client(db, client_id, client_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update client")

@router.delete("/{client_id}", response_model=MessageResponse, operation_id="clients.delete")
async def delete_client(
    client_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Delete a client. Supports both JWT and API key authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        client_service.delete_client(db, client_id)
        return MessageResponse(message="Client deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete client")