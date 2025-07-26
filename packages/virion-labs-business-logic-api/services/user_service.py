from typing import Optional, Dict, Any
from core.strapi_client import strapi_client
from schemas.user_settings import UserSettingsUpdate

async def get_user_settings_by_user_id(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieves user settings from Strapi by the user's ID from the users-permissions_user table.
    """
    try:
        # The user_id corresponds to the ID in Strapi's users-permissions_user table.
        # We need to find the user-profile that links to this user.
        # Then, from the user-profile, we get the related user-setting.
        
        # This logic assumes a way to link users-permissions_user to user-profile.
        # A common way is to have a relation. If not, a custom endpoint in Strapi is better.
        # For now, let's assume we can filter user-profiles by a 'user' relation field.
        # This is a guess and might need to be adjusted based on the actual Strapi setup.
        
        filters = {"filters[user][id][$eq]": user_id, "populate": "user_setting"}
        user_profiles = await strapi_client.get_user_profiles(filters=filters)
        
        if user_profiles and len(user_profiles) > 0:
            profile = user_profiles[0].get("attributes", {})
            settings = profile.get("user_setting", {}).get("data")
            if settings:
                return settings.get("attributes")
        return None
    except Exception as e:
        print(f"Error fetching user settings from Strapi: {e}")
        return None

async def update_user_settings(user_id: int, settings_update: UserSettingsUpdate) -> Optional[Dict[str, Any]]:
    """
    Updates user settings in Strapi.
    """
    try:
        # 1. Find the user-profile associated with the user ID.
        filters = {"filters[user][id][$eq]": user_id, "populate": "user_setting"}
        user_profiles = await strapi_client.get_user_profiles(filters=filters)

        if not user_profiles:
            return None

        # 2. Get the ID of the related user-setting content type.
        profile = user_profiles[0].get("attributes", {})
        user_setting_relation = profile.get("user_setting", {}).get("data")
        if not user_setting_relation:
            # Here you might want to create a new user-setting entry.
            # For now, we'll assume it exists.
            return None
            
        setting_id = user_setting_relation.get("id")
        if not setting_id:
            return None

        # 3. Update the user-setting entry.
        update_data = settings_update.model_dump(exclude_unset=True)
        updated_settings = await strapi_client.update_user_setting(setting_id, update_data)
        
        return updated_settings.get("attributes")
    except Exception as e:
        print(f"Error updating user settings in Strapi: {e}")
        return None
