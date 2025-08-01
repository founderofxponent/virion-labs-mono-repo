from typing import Optional
from fastapi import HTTPException
from core.strapi_client import strapi_client
from domain.users.schemas import UserSettingUpdate, UserSettingResponse
from schemas.strapi import StrapiUserSettingUpdate
from schemas.user_schemas import User
import logging

logger = logging.getLogger(__name__)

class UserService:
    """Service layer for handling user-related business logic."""

    async def get_user_settings(self, current_user: User) -> Optional[UserSettingResponse]:
        """
        Retrieves the settings for the current user.
        Note: Strapi's 'users/me' endpoint automatically provides this.
        This service method ensures a consistent, validated response.
        """
        try:
            # The user object from the auth dependency already contains settings.
            # We just need to validate and return them.
            if not current_user.settings:
                return None
            
            # The settings are already populated by the get_current_user dependency
            return UserSettingResponse(**current_user.settings)

        except Exception as e:
            logger.error(f"Error retrieving user settings for user {current_user.id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to retrieve user settings.")

    async def update_user_settings(self, updates: UserSettingUpdate, current_user: User) -> UserSettingResponse:
        """
        Handles the business logic for updating a user's settings.
        """
        try:
            if not current_user.settings or not current_user.settings.get('id'):
                raise HTTPException(status_code=404, detail="User settings not found for the current user.")

            setting_id = current_user.settings['id']
            
            strapi_data = StrapiUserSettingUpdate(**updates.model_dump(exclude_unset=True))
            
            updated_settings = await strapi_client.update_user_setting(setting_id, strapi_data)
            
            return UserSettingResponse(**updated_settings.model_dump())

        except Exception as e:
            logger.error(f"Error updating user settings for user {current_user.id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update user settings.")

# Global instance of the service
user_service = UserService()
