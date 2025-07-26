from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any

from core.auth import StrapiUser, get_current_user
from services.user_service import get_user_settings_by_user_id, update_user_settings as update_settings_service
from schemas.user_settings import UserSettings, UserSettingsUpdate

router = APIRouter()

@router.get("/users/me/settings", response_model=UserSettings)
async def read_current_user_settings(
    current_user: StrapiUser = Depends(get_current_user)
) -> Any:
    """
    Retrieve settings for the current user.
    """
    if not current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no valid identifier",
        )
        
    settings = await get_user_settings_by_user_id(user=current_user)
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User settings not found"
        )
        
    return settings

@router.patch("/users/me/settings", response_model=UserSettings)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: StrapiUser = Depends(get_current_user)
) -> Any:
    """
    Update settings for the current user.
    """
    if not current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no valid identifier",
        )

    updated_settings = await update_settings_service(
        user_id=current_user.id, 
        settings_update=settings_update
    )

    if not updated_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User settings not found or failed to update",
        )

    return updated_settings
