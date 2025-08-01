from fastapi import APIRouter, Depends, HTTPException, status
from services.user_service import user_service
from core.auth import get_current_user
from schemas.user_schemas import User, UserSetting, UserSettingUpdate
from domain.users.schemas import UserSettingUpdate as DomainUserSettingUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/users/me/settings", response_model=UserSetting)
async def read_current_user_settings(current_user: User = Depends(get_current_user)):
    """Retrieves the settings for the currently authenticated user."""
    try:
        settings = await user_service.get_user_settings(current_user)
        if not settings:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User settings not found")
        return settings
    except Exception as e:
        logger.error(f"Read user settings failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/users/me/settings", response_model=UserSetting)
async def update_user_settings(request: UserSettingUpdate, current_user: User = Depends(get_current_user)):
    """Updates the settings for the currently authenticated user."""
    try:
        update_data = DomainUserSettingUpdate(**request.model_dump(exclude_unset=True))
        updated_settings = await user_service.update_user_settings(update_data, current_user)
        return updated_settings
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user settings failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
