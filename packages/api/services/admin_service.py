from supabase import Client
from typing import List
from uuid import UUID
from schemas.admin import AccessRequest

def get_access_requests(db: Client) -> List[AccessRequest]:
    """
    Retrieves all access requests from the database.
    """
    response = db.table("access_requests").select("*").execute()
    if response.data:
        return [AccessRequest.model_validate(item) for item in response.data]
    return []

def update_access_request_status(db: Client, request_id: UUID, status: str) -> AccessRequest:
    """
    Updates the status of a specific access request.
    """
    response = (
        db.table("access_requests")
        .update({"status": status, "updated_at": "now()"})
        .eq("id", request_id)
        .execute()
    )
    if response.data:
        return AccessRequest.model_validate(response.data[0])
    # Handle case where request is not found
    raise ValueError(f"Access request with id {request_id} not found.") 