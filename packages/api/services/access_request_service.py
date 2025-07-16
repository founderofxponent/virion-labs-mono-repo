from supabase import Client
from datetime import datetime

from schemas.access_request import AccessRequestCreate

def create_access_request(db: Client, request_data: AccessRequestCreate) -> dict:
    """
    Create a new access request.
    """
    # Check if access request already exists for this user and guild
    existing_request = db.table("access_requests").select("*").eq("discord_user_id", request_data.discord_user_id).eq("discord_guild_id", request_data.discord_guild_id).execute()
    if existing_request.data:
        raise ValueError("Access request already exists for this user and guild")
    
    # Create access request
    request_record = {
        "discord_user_id": request_data.discord_user_id,
        "discord_username": request_data.discord_username,
        "discord_guild_id": request_data.discord_guild_id,
        "full_name": request_data.full_name,
        "email": request_data.email,
        "verified_role_id": request_data.verified_role_id,
        "status": "pending",
        "additional_data": request_data.additional_data or {},
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("access_requests").insert(request_record).execute()
    if not response.data:
        raise Exception("Failed to create access request")
    
    return {"message": "Access request submitted successfully", "request_id": response.data[0]["id"]}