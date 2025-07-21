from supabase import Client
from typing import List
from uuid import UUID
# Generated schemas
from schemas.db.access_requests import AccessRequest

# Manual schemas for types not yet generated
from schemas.api.admin import AdminUserProfile, AdminUserListResponse

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

def get_all_users(db: Client) -> AdminUserListResponse:
    """
    Get all users in the system with their access requests and additional admin info.
    """
    try:
        # First, try to get users from users table
        users = []
        try:
            users_response = db.table("users").select("*").order("created_at", desc=True).execute()
            
            if users_response.data:
                for user_row in users_response.data:
                    # Get access requests for this user
                    access_requests = []
                    if user_row.get("discord_user_id"):
                        try:
                            ar_response = db.table("access_requests").select("*").eq("discord_user_id", user_row["discord_user_id"]).order("created_at", desc=True).execute()
                            if ar_response.data:
                                access_requests = [AccessRequest.model_validate(ar) for ar in ar_response.data]
                        except:
                            pass
                    
                    # Get campaign count for this user
                    total_campaigns = 0
                    if user_row.get("id"):
                        try:
                            campaigns_response = db.table("discord_guild_campaigns").select("id").eq("user_id", user_row["id"]).execute()
                            total_campaigns = len(campaigns_response.data) if campaigns_response.data else 0
                        except:
                            pass
                    
                    # Build user profile
                    user_data = {
                        "id": user_row["id"],
                        "email": user_row["email"],
                        "full_name": user_row["full_name"],
                        "discord_user_id": user_row.get("discord_user_id"),
                        "discord_username": user_row.get("discord_username"),
                        "email_confirmed": user_row.get("email_confirmed", False),
                        "created_at": user_row["created_at"],
                        "updated_at": user_row["updated_at"],
                        "access_requests": access_requests,
                        "total_campaigns": total_campaigns,
                        "last_activity": user_row.get("updated_at")
                    }
                    
                    users.append(AdminUserProfile.model_validate(user_data))
        except:
            # If users table doesn't exist, try to get data from access_requests
            try:
                ar_response = db.table("access_requests").select("*").order("created_at", desc=True).execute()
                
                if ar_response.data:
                    # Group access requests by user
                    users_dict = {}
                    for ar in ar_response.data:
                        user_key = ar.get("discord_user_id")
                        if user_key:
                            if user_key not in users_dict:
                                users_dict[user_key] = {
                                    "id": ar.get("id"),  # Use access request ID as fallback
                                    "email": ar.get("email"),
                                    "full_name": ar.get("full_name"),
                                    "discord_user_id": ar.get("discord_user_id"),
                                    "discord_username": ar.get("discord_username"),
                                    "email_confirmed": False,
                                    "created_at": ar.get("created_at"),
                                    "updated_at": ar.get("updated_at"),
                                    "access_requests": [],
                                    "total_campaigns": 0,
                                    "last_activity": ar.get("updated_at")
                                }
                            
                            users_dict[user_key]["access_requests"].append(AccessRequest.model_validate(ar))
                    
                    # Convert to user profiles
                    for user_data in users_dict.values():
                        users.append(AdminUserProfile.model_validate(user_data))
            except:
                pass
        
        return AdminUserListResponse(
            success=True,
            message="Users retrieved successfully" if users else "No users found",
            users=users,
            total_count=len(users)
        )
    
    except Exception as e:
        return AdminUserListResponse(
            success=False,
            message=f"Failed to retrieve users: {str(e)}",
            users=[],
            total_count=0
        ) 