from supabase import Client
from typing import List
from uuid import UUID
from datetime import datetime

from schemas.auth import UserProfile

def get_user_profile(db: Client, user_id: UUID) -> UserProfile:
    """
    Get user profile by ID.
    """
    response = db.table("users").select("*").eq("id", user_id).execute()
    if not response.data:
        raise ValueError("User not found")
    
    return UserProfile.model_validate(response.data[0])

def get_all_users(db: Client) -> List[UserProfile]:
    """
    Get all users (admin only).
    """
    response = db.table("users").select("*").execute()
    if response.data:
        return [UserProfile.model_validate(user) for user in response.data]
    return []

def update_user_profile(db: Client, user_id: UUID, updates: dict) -> UserProfile:
    """
    Update user profile.
    """
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    response = db.table("users").update(updates).eq("id", user_id).execute()
    if not response.data:
        raise ValueError("User not found")
    
    return UserProfile.model_validate(response.data[0])

def delete_user(db: Client, user_id: UUID) -> None:
    """
    Delete user account.
    """
    response = db.table("users").delete().eq("id", user_id).execute()
    if not response.data:
        raise ValueError("User not found")