from typing import Dict, Any, List
from core.strapi_client import strapi_client
from domain.integrations.discord.domain import DiscordDomain
from schemas.integration_schemas import Campaign
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class IntegrationService:
    """Service layer for integration operations."""

    def __init__(self):
        self.discord_domain = DiscordDomain()

    async def get_discord_campaigns(self, guild_id: str, channel_id: str, join_campaigns_channel_id: str) -> List[Campaign]:
        """
        Business operation for fetching Discord campaigns.
        """
        try:
            all_campaigns = await strapi_client.get_campaigns({"filters[guild_id][$eq]": guild_id})
            
            filtered_campaigns = self.discord_domain.filter_campaigns_for_channel(
                all_campaigns, channel_id, join_campaigns_channel_id
            )
            
            return [Campaign(**c) for c in filtered_campaigns]
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

    async def start_discord_onboarding(self, campaign_id: str, discord_user_id: str, discord_username: str) -> Dict[str, Any]:
        """
        Business operation for starting Discord onboarding and fetching campaign fields.
        """
        try:
            # Fetch onboarding fields from Strapi using existing method
            fields_data = await strapi_client.get_onboarding_fields(campaign_id)
            
            # Transform Strapi field data to match our schema format
            transformed_fields = []
            for field in fields_data:
                transformed_field = {
                    "field_key": field.get("field_key", ""),
                    "field_label": field.get("field_label", ""),
                    "field_type": field.get("field_type", "text"),
                    "field_placeholder": field.get("field_placeholder"),
                    "field_description": field.get("field_description"),
                    "field_options": field.get("field_options", []) if field.get("field_options") else None,
                    "is_required": field.get("is_required", False),
                    "validation_rules": field.get("validation_rules")
                }
                transformed_fields.append(transformed_field)
            
            # Log onboarding start (could be expanded to track analytics)
            logger.info(f"Discord onboarding started for user {discord_user_id} on campaign {campaign_id}")
            
            return {"success": True, "fields": transformed_fields}
            
        except Exception as e:
            logger.error(f"Failed to start Discord onboarding: {e}")
            return {"success": False, "fields": [], "message": "Failed to fetch onboarding fields."}

    async def submit_discord_onboarding(self, campaign_id: str, discord_user_id: str, discord_username: str, responses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Business operation for handling Discord onboarding submission.
        This creates a user profile with the onboarding responses.
        """
        try:
            # Create user profile data from onboarding responses
            profile_data = {
                "discord_user_id": discord_user_id,
                "discord_username": discord_username,
                "campaign_id": campaign_id,
                "is_verified": True,  # Auto-verify on onboarding completion
                **responses  # Include all onboarding field responses
            }
            
            # Create user profile in Strapi
            await strapi_client.create_user_profile(profile_data)
            
            # Update campaign statistics (increment successful_onboardings)
            try:
                campaign_data = await strapi_client.get_campaign(campaign_id)
                if campaign_data:
                    current_count = campaign_data.get("successful_onboardings", 0)
                    await strapi_client.update_campaign(campaign_id, {
                        "successful_onboardings": current_count + 1,
                        "last_activity_at": "new Date().toISOString()"
                    })
            except Exception as stats_error:
                logger.warning(f"Failed to update campaign statistics: {stats_error}")
                # Don't fail the entire operation if statistics update fails
            
            logger.info(f"Discord onboarding completed for user {discord_user_id} on campaign {campaign_id}")
            return {"success": True, "message": "Onboarding completed successfully!"}
            
        except Exception as e:
            logger.error(f"Failed to submit Discord onboarding: {e}")
            return {"success": False, "message": "Failed to complete onboarding. Please try again."}

    async def has_verified_role(self, user_id: str, guild_id: str) -> bool:
        """
        Check if a Discord user has the verified role in a guild.
        This is a placeholder - in real implementation, this would check Discord API.
        """
        try:
            # For now, check if user profile exists and is verified
            user_profiles = await strapi_client.get_user_profiles({
                "filters[discord_user_id][$eq]": user_id
            })
            
            if user_profiles:
                return user_profiles[0].get("is_verified", False)
            
            return False
        except Exception as e:
            logger.error(f"Failed to check verified role: {e}")
            return False

integration_service = IntegrationService()