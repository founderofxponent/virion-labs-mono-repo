from typing import Dict, Any, List
from core.strapi_client import strapi_client
from domain.integrations.discord.domain import DiscordDomain
from schemas.integration_schemas import Campaign
import logging

logger = logging.getLogger(__name__)

class IntegrationService:
    """Service layer for integration operations."""

    def __init__(self):
        self.discord_domain = DiscordDomain()

    async def get_discord_campaigns(self, guild_id: str, channel_id: str) -> List[Campaign]:
        """
        Business operation for fetching Discord campaigns.
        """
        try:
            # For now, we assume a single config for the guild.
            # This could be expanded to fetch guild-specific configs.
            join_campaigns_channel_id = "YOUR_DEFAULT_JOIN_CHANNEL_ID" # This should come from a config service
            
            all_campaigns = await strapi_client.get_campaigns({"filters[discord_guild_id][$eq]": guild_id})
            
            filtered_campaigns = self.discord_domain.filter_campaigns_for_channel(
                all_campaigns, channel_id, join_campaigns_channel_id
            )
            
            return [Campaign(**c["attributes"]) for c in filtered_campaigns]
        except Exception as e:
            logger.error(f"Failed to get Discord campaigns: {e}")
            raise

    async def request_discord_access(self, access_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Business operation for handling a Discord access request.
        This involves creating a user profile.
        """
        try:
            # In a real scenario, you might check for an existing user first.
            profile_data = {
                "discord_user_id": access_data["user_id"],
                "discord_username": access_data["user_tag"],
                "email": access_data["email"],
                "full_name": access_data["name"],
                "is_verified": True # Automatically verify on submission for now
            }
            await strapi_client.create_user_profile(profile_data)
            
            # Here you would also trigger giving the user the 'Verified' role in Discord.
            # This would likely involve a call to a Discord API client.
            
            return {"success": True, "message": "Access granted successfully."}
        except Exception as e:
            logger.error(f"Failed to process Discord access request: {e}")
            return {"success": False, "message": "An error occurred."}

    async def has_verified_role(self, user_id: str, guild_id: str) -> bool:
        """
        Business operation to check if a user has the verified role.
        """
        try:
            # This should come from a config service for the guild
            verified_role_id = "YOUR_VERIFIED_ROLE_ID" 
            
            # This is a placeholder. In a real implementation, you would get the user's
            # roles from a Discord API client.
            user_roles = [] 
            
            return self.discord_domain.has_verified_role(user_roles, verified_role_id)
        except Exception as e:
            logger.error(f"Failed to check for verified role: {e}")
            return False

integration_service = IntegrationService()