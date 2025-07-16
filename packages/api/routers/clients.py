from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import client_service, auth_service
from schemas.client import Client, ClientCreate, ClientUpdate

router = APIRouter(
    prefix="/api/clients",
    tags=["Clients"],
)

security = HTTPBearer()

@router.get("/", response_model=List[Client])
async def list_clients(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    List all clients.
    """
    try:
        # Verify user is authenticated
        auth_service.get_user_id_from_token(credentials.credentials)
        return client_service.get_all_clients(db)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve clients")

@router.post("/", response_model=Client)
async def create_client(
    client_data: ClientCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Create a new client.
    """
    try:
        # Verify user is authenticated
        auth_service.get_user_id_from_token(credentials.credentials)
        return client_service.create_client(db, client_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create client")

@router.get("/{client_id}", response_model=Client)
async def get_client(
    client_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Get client details by ID.
    """
    try:
        # Verify user is authenticated
        auth_service.get_user_id_from_token(credentials.credentials)
        return client_service.get_client_by_id(db, client_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve client")

@router.patch("/{client_id}", response_model=Client)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Update client details.
    """
    try:
        # Verify user is authenticated
        auth_service.get_user_id_from_token(credentials.credentials)
        return client_service.update_client(db, client_id, client_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update client")

@router.delete("/{client_id}")
async def delete_client(
    client_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Delete a client.
    """
    try:
        # Verify user is authenticated
        auth_service.get_user_id_from_token(credentials.credentials)
        client_service.delete_client(db, client_id)
        return {"message": "Client deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete client")