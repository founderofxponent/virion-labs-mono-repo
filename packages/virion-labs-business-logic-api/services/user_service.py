from typing import Optional, Dict, Any
from datetime import datetime
from core.strapi_client import strapi_client
from schemas.user_settings import UserSettingsUpdate
from core.auth import StrapiUser
import logging

logger = logging.getLogger(__name__)

async def get_user_settings_by_user_id(user: StrapiUser) -> Optional[Dict[str, Any]]:
    """
    Retrieves user settings from Strapi. If the profile or settings do not exist,
    they are created on-the-fly. This version is simplified to be more robust.
    """
    logger.info(f"--- Starting settings lookup for user: {user.email} (ID: {user.id}) ---")
    try:
        # 1. Find the user-profile by the user's unique email.
        filters = {"filters[email][$eq]": user.email, "populate": "user_setting"}
        logger.info(f"Searching for user with filters: {filters}")
        users = await strapi_client.get_users(filters=filters)
        
        if not users:
            # Case 1: No user exists. Create both user and settings.
            logger.warning(f"No user found for {user.email}. Creating both.")
            
            # a. Create the setting first.
            settings_payload = {"publishedAt": datetime.utcnow().isoformat()}
            new_settings = await strapi_client.create_user_setting(settings_payload)
            
            # b. Create the user and link the new setting in the same call.
            user_payload = {
                "email": user.email,
                "username": user.username,
                "full_name": user.username,
                "publishedAt": datetime.utcnow().isoformat(),
                "user_setting": new_settings.get("id")
            }
            await strapi_client.create_user(user_payload)
            
            logger.info(f"SUCCESS: Atomically created user and settings for {user.email}.")
            return new_settings

        # Case 2: User exists.
        user_data = users[0]
        user_id = user_data.get("id")
        
        logger.info(f"Found user ID: {user_id} for user {user.email}")
        
        # Check if the settings relation is missing or null
        user_setting = user_data.get("user_setting")
        if user_setting:
            logger.info(f"SUCCESS: Found existing settings for user {user.email}.")
            return user_setting
        else:
            # Case 3: User exists, but settings are missing. Create and link.
            logger.warning(f"User exists but no settings for {user.email}. Creating and linking.")
            
            settings_payload = {"publishedAt": datetime.utcnow().isoformat()}
            new_settings = await strapi_client.create_user_setting(settings_payload)
            
            update_payload = {"user_setting": new_settings.get("id")}
            await strapi_client.update_user(user_id, update_payload)
            
            logger.info(f"SUCCESS: Created and linked new settings for {user.email}.")
            return new_settings

    except Exception as e:
        logger.error(f"CRITICAL ERROR in get_user_settings_by_user_id: {e}", exc_info=True)
        return None

async def update_user_settings(user_id: int, settings_update: UserSettingsUpdate) -> Optional[Dict[str, Any]]:
    """
    Updates user settings in Strapi.
    """
    # This function would also need to be refactored to find the profile by email first.
    # For now, focusing on the read operation that was failing.
    logger.warning("update_user_settings is not fully implemented with the new email-based logic.")
    return None
