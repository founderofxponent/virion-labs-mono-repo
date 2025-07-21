from supabase import Client as SupabaseClient
from typing import List
from uuid import UUID
from datetime import datetime

from schemas.db.clients import Client, ClientCreate, ClientUpdate

def get_all_clients(db: SupabaseClient) -> List[Client]:
    """
    Get all clients.
    """
    response = db.table("clients").select("*").execute()
    if response.data:
        return [Client.model_validate(client) for client in response.data]
    return []

def get_client_by_id(db: SupabaseClient, client_id: UUID) -> Client:
    """
    Get client by ID.
    """
    response = db.table("clients").select("*").eq("id", client_id).execute()
    if not response.data:
        raise ValueError("Client not found")
    
    return Client.model_validate(response.data[0])

def create_client(db: SupabaseClient, client_data: ClientCreate) -> Client:
    """
    Create a new client.
    """
    client_record = {
        **client_data.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("clients").insert(client_record).execute()
    if not response.data:
        raise Exception("Failed to create client")
    
    return Client.model_validate(response.data[0])

def update_client(db: SupabaseClient, client_id: UUID, client_data: ClientUpdate) -> Client:
    """
    Update client details.
    """
    # Remove None values
    updates = {k: v for k, v in client_data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    response = db.table("clients").update(updates).eq("id", client_id).execute()
    if not response.data:
        raise ValueError("Client not found")
    
    return Client.model_validate(response.data[0])

def delete_client(db: SupabaseClient, client_id: UUID) -> None:
    """
    Delete a client.
    """
    response = db.table("clients").delete().eq("id", client_id).execute()
    if not response.data:
        raise ValueError("Client not found")