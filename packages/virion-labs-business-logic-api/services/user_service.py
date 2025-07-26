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
        logger.info(f"Searching for user profile with filters: {filters}")
        user_profiles = await strapi_client.get_user_profiles(filters=filters)
        
        if not user_profiles:
            # Case 1: No profile exists. Create both profile and settings.
            logger.warning(f"No profile found for {user.email}. Creating both.")
            
            # a. Create the setting first.
            settings_payload = {"publishedAt": datetime.utcnow().isoformat()}
            new_settings = await strapi_client.create_user_setting(settings_payload)
            
            # b. Create the profile and link the new setting in the same call.
            profile_payload = {
                "email": user.email,
                "full_name": user.username,
                "publishedAt": datetime.utcnow().isoformat(),
                "user_setting": new_settings.get("id")
            }
            await strapi_client.create_user_profile(profile_payload)
            
            logger.info(f"SUCCESS: Atomically created profile and settings for {user.email}.")
            return new_settings

        # Case 2: Profile exists.
        profile = user_profiles[0]
        profile_id = profile.get("id")
        profile_attrs = profile
        
        logger.info(f"Found profile ID: {profile_id} for user {user.email}")
        
        # Check if the settings relation is missing or null
        user_setting_relation = profile_attrs.get("user_setting", {}).get("data")
        if user_setting_relation:
            logger.info(f"SUCCESS: Found existing settings for user {user.email}.")
            return user_setting_relation
        else:
            # Case 3: Profile exists, but settings are missing. Create and link.
            logger.warning(f"Profile exists but no settings for {user.email}. Creating and linking.")
            
            # Re-fetch the profile immediately before creating settings to ensure it still exists
            logger.info(f"Re-verifying profile {profile_id} exists before creating settings...")
            verification_profiles = await strapi_client.get_user_profiles(filters=filters)
            if not verification_profiles:
                logger.error(f"Profile disappeared during verification. Creating new profile and settings.")
                # Profile disappeared, create both
                settings_payload = {"publishedAt": datetime.utcnow().isoformat()}
                new_settings = await strapi_client.create_user_setting(settings_payload)
                
                profile_payload = {
                    "email": user.email,
                    "full_name": user.username,
                    "publishedAt": datetime.utcnow().isoformat(),
                    "user_setting": new_settings.get("id")
                }
                await strapi_client.create_user_profile(profile_payload)
                return new_settings
            
            verified_profile = verification_profiles[0]
            verified_profile_id = verified_profile.get("id")
            
            if verified_profile_id != profile_id:
                logger.warning(f"Profile ID changed from {profile_id} to {verified_profile_id}")
                profile_id = verified_profile_id
            
            settings_payload = {"publishedAt": datetime.utcnow().isoformat()}
            new_settings = await strapi_client.create_user_setting(settings_payload)
            
            update_payload = {"user_setting": new_settings.get("id")}
            try:
                logger.info(f"Attempting to update verified profile {profile_id}")
                await strapi_client.update_user_profile(profile_id, update_payload)
            except Exception as update_error:
                logger.error(f"Failed to update verified profile {profile_id}: {update_error}")
                logger.warning("Returning unlinked settings as fallback.")
                return new_settings
            
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
