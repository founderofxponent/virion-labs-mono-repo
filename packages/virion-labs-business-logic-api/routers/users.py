from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from domain.models.user import User
from services.auth_service import get_current_active_user
from services.user_service import get_user_settings_by_user_id
from schemas.user_settings import UserSettings

router = APIRouter()

@router.get("/users/me/settings", response_model=UserSettings)
def read_current_user_settings(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Retrieve settings for the current user.
    """
    if not current_user.document_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no valid identifier",
        )
        
    settings = get_user_settings_by_user_id(user_id=current_user.document_id)
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User settings not found"
        )
        
    return settings
