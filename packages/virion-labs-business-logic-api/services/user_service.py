from typing import Optional
from fastapi import HTTPException
from core.strapi_client import strapi_client
from domain.users.schemas import UserSettingUpdate, UserSettingResponse
from schemas.strapi import StrapiUserSettingUpdate, StrapiUserSettingCreate
from schemas.user_schemas import User
import logging

logger = logging.getLogger(__name__)

class UserService:
    """Service layer for handling user-related business logic."""

    async def get_user_settings(self, current_user: User) -> Optional[UserSettingResponse]:
        """
        Retrieves the settings for the current user.
        """
        if not current_user.settings:
            raise HTTPException(status_code=404, detail="User settings not found.")
        
        return UserSettingResponse(**current_user.settings.model_dump())

    async def update_user_settings(self, updates: UserSettingUpdate, current_user: User) -> UserSettingResponse:
        """
        Handles the business logic for updating a user's settings.
        """
        try:
            if not current_user.settings or not current_user.settings.id:
                raise HTTPException(status_code=404, detail="User settings not found for the current user.")

            setting_id = current_user.settings.id
            
            strapi_data = StrapiUserSettingUpdate(**updates.model_dump(exclude_unset=True))
            
            updated_settings = await strapi_client.update_user_setting(setting_id, strapi_data)
            
            return UserSettingResponse(**updated_settings.model_dump())

        except Exception as e:
            logger.error(f"Error updating user settings for user {current_user.id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update user settings.")

    async def check_and_create_user_settings(self, user_id: int):
        """
        Checks if a user has settings, and if not, creates them.
        Also checks and updates user role if they have the default "Authenticated" role.
        """
        try:
            user = await strapi_client.get_user(user_id)
            
            # Check and update role if needed
            await self._check_and_update_user_role(user_id, user)
            
            if not user.get('user_setting'):
                logger.info(f"User {user_id} does not have settings. Creating them now.")
                
                # Step 1: Create a new, unlinked user setting.
                new_setting = await strapi_client.create_user_setting(StrapiUserSettingCreate())
                
                if new_setting and new_setting.id:
                    logger.info(f"Successfully created new user setting with ID: {new_setting.id}")
                    
                    # Step 2: Update the user to link to the new setting.
                    await strapi_client.update_user_setting_relation(user_id, new_setting.id)
                    logger.info(f"Successfully linked user {user_id} to new setting {new_setting.id}.")
                else:
                    logger.error(f"Failed to create a new user setting for user {user_id}.")
        except Exception as e:
            logger.error(f"Error in check_and_create_user_settings for user {user_id}: {e}")
            # We don't re-raise the exception to avoid blocking the login flow
            pass

    async def _check_and_update_user_role(self, user_id: int, user: dict):
        """
        Checks if user has default 'Authenticated' role and updates to appropriate role.
        For now, defaults to 'Influencer' role. 
        Platform Administrator role should be assigned manually via admin panel.
        """
        try:
            current_role = user.get('role', {})
            current_role_name = current_role.get('name') if current_role else None
            
            # Only update role if user has the default "Authenticated" role
            if current_role_name == "Authenticated":
                logger.info(f"User {user_id} has default 'Authenticated' role. Updating to 'Influencer'.")
                
                # Get the Influencer role
                influencer_role = await strapi_client.get_role_by_name("Influencer")
                
                if influencer_role and influencer_role.get('id'):
                    await strapi_client.update_user_role(user_id, influencer_role['id'])
                    logger.info(f"Successfully updated user {user_id} role to 'Influencer'.")
                else:
                    logger.warning(f"Could not find 'Influencer' role in Strapi. User {user_id} keeps 'Authenticated' role.")
                    
        except Exception as e:
            logger.error(f"Error updating user role for user {user_id}: {e}")
            # Don't re-raise to avoid blocking the login flow

# Global instance of the service
user_service = UserService()
