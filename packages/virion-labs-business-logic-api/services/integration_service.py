from typing import Dict, Any, List
import httpx
from core.strapi_client import strapi_client
from domain.integrations.discord.domain import DiscordDomain
from schemas.integration_schemas import Campaign
from core.config import settings
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class IntegrationService:
    """Service layer for integration operations."""

    def __init__(self):
        self.discord_domain = DiscordDomain()

    async def create_managed_invite(self, referral_code: str) -> Dict[str, Any]:
        """
        Create a managed Discord invite for a referral campaign.
        """
        try:
            logger.info(f"Creating managed Discord invite for referral code: {referral_code}")
            
            # Find the referral link to get campaign info
            filters = {
                "filters[referral_code][$eq]": referral_code,
                "populate[0]": "campaign",
            }
            referral_links = await strapi_client.get_referral_links(filters=filters)
            
            if not referral_links:
                return {
                    "success": False,
                    "message": f"Referral link with code '{referral_code}' not found"
                }
            
            referral_link = referral_links[0]
            campaign = referral_link.campaign
            
            if not campaign or not campaign.guild_id:
                return {
                    "success": False,
                    "message": "Campaign Discord server not configured"
                }
            
            # Create Discord invite using Discord API
            if not settings.DISCORD_BOT_TOKEN:
                logger.warning("DISCORD_BOT_TOKEN not configured, cannot create managed invite")
                # Return fallback to existing discord_invite_url if available
                fallback_url = getattr(referral_link, 'discord_invite_url', None)
                if fallback_url:
                    return {
                        "success": True,
                        "invite_url": fallback_url,
                        "message": "Using fallback invite URL"
                    }
                return {
                    "success": False,
                    "message": "Discord bot not configured and no fallback invite available"
                }
            
            # Use Discord API to create a managed invite
            # First, get the guild's channels to find a suitable channel for the invite
            guild_id = campaign.guild_id
            
            async with httpx.AsyncClient() as client:
                # Get guild channels
                headers = {"Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}"}
                
                channels_response = await client.get(
                    f"https://discord.com/api/v10/guilds/{guild_id}/channels",
                    headers=headers
                )
                
                if channels_response.status_code != 200:
                    logger.error(f"Failed to get guild channels: {channels_response.status_code} - {channels_response.text}")
                    return {
                        "success": False,
                        "message": "Failed to access Discord server"
                    }
                
                channels = channels_response.json()
                
                # Find a suitable channel (preferably general or system channel)
                target_channel_id = campaign.channel_id  # Use campaign's specific channel if set
                
                if not target_channel_id:
                    # Find the first text channel that the bot can create invites in
                    for channel in channels:
                        if channel.get('type') == 0:  # Text channel
                            target_channel_id = channel['id']
                            break
                
                if not target_channel_id:
                    return {
                        "success": False,
                        "message": "No suitable channel found for invite creation"
                    }
                
                # Create the invite
                invite_data = {
                    "max_age": 0,  # Never expires
                    "max_uses": 0,  # Unlimited uses
                    "temporary": False,  # Permanent membership
                    "unique": True  # Create a unique invite
                }
                
                invite_response = await client.post(
                    f"https://discord.com/api/v10/channels/{target_channel_id}/invites",
                    headers=headers,
                    json=invite_data
                )
                
                if invite_response.status_code == 200:
                    invite_json = invite_response.json()
                    invite_url = f"https://discord.gg/{invite_json['code']}"
                    
                    logger.info(f"Successfully created Discord invite: {invite_url}")
                    return {
                        "success": True,
                        "invite_url": invite_url,
                        "message": "Discord invite created successfully"
                    }
                else:
                    logger.error(f"Failed to create Discord invite: {invite_response.status_code} - {invite_response.text}")
                    return {
                        "success": False,
                        "message": "Failed to create Discord invite"
                    }
                    
        except Exception as e:
            logger.error(f"Error creating managed Discord invite: {e}")
            return {
                "success": False,
                "message": "Internal error creating Discord invite"
            }


    async def get_discord_campaigns(self, guild_id: str, channel_id: str, join_campaigns_channel_id: str) -> List[Campaign]:
        """
        Business operation for fetching Discord campaigns.
        """
        try:
            logger.info(f"🔍 Fetching campaigns for guild_id: {guild_id}, channel_id: {channel_id}, join_campaigns_channel_id: {join_campaigns_channel_id}")
            
            all_campaigns = await strapi_client.get_campaigns({"filters[guild_id][$eq]": guild_id})
            logger.info(f"📊 Retrieved {len(all_campaigns)} total campaigns from Strapi")
            
            # Log all campaign details for debugging
            for i, campaign in enumerate(all_campaigns):
                logger.debug(f"Campaign {i+1}: id={campaign.id}, documentId={getattr(campaign, 'documentId', None)}, name={campaign.name}, channel_id={getattr(campaign, 'channel_id', None)}")
            
            filtered_campaigns = self.discord_domain.filter_campaigns_for_channel(
                all_campaigns, channel_id, join_campaigns_channel_id
            )
            logger.info(f"🎯 After filtering: {len(filtered_campaigns)} campaigns remain")
            
            # Log filtered campaign details
            for i, campaign in enumerate(filtered_campaigns):
                logger.info(f"Filtered Campaign {i+1}: id={campaign.id}, documentId={getattr(campaign, 'documentId', None)}, name={campaign.name}")
            
            # Check for duplicate documentIds
            document_ids = [getattr(c, 'documentId', None) for c in filtered_campaigns]
            unique_document_ids = set(document_ids)
            if len(document_ids) != len(unique_document_ids):
                logger.warning(f"⚠️  DUPLICATE DOCUMENT IDs DETECTED!")
                logger.warning(f"Total campaigns: {len(document_ids)}, Unique documentIds: {len(unique_document_ids)}")
                logger.warning(f"DocumentIds: {document_ids}")
                
                # Log which documentIds are duplicated
                from collections import Counter
                id_counts = Counter(document_ids)
                duplicates = {doc_id: count for doc_id, count in id_counts.items() if count > 1}
                logger.warning(f"Duplicate documentIds: {duplicates}")
            
            result_campaigns = [Campaign(**c) for c in filtered_campaigns]
            logger.info(f"✅ Returning {len(result_campaigns)} campaigns to Discord bot")
            
            return result_campaigns
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
            # First, check if campaign_id is numeric ID or documentId
            # If it's numeric, we need to get the campaign first to get its documentId
            document_id = campaign_id
            
            # If campaign_id looks like a numeric ID, fetch the campaign to get its documentId
            if campaign_id.isdigit():
                logger.info(f"Campaign ID {campaign_id} appears to be numeric, fetching campaign to get documentId")
                campaigns = await strapi_client.get_campaigns({"filters[id][$eq]": campaign_id})
                if campaigns:
                    document_id = getattr(campaigns[0], 'documentId', None)
                    logger.info(f"Found documentId {document_id} for campaign ID {campaign_id}")
                else:
                    logger.error(f"Campaign with ID {campaign_id} not found")
                    return {"success": False, "fields": [], "message": "Campaign not found"}

            # Check if user has already completed onboarding for this campaign
            existing_completions = await strapi_client.get_onboarding_completions({
                "filters[discord_user_id][$eq]": discord_user_id,
                "filters[campaign][documentId][$eq]": document_id
            })
            if existing_completions:
                logger.info(f"User {discord_user_id} has already completed onboarding for campaign {document_id}")
                return {"success": False, "fields": [], "message": "You have already completed the onboarding for this campaign."}
            
            # Create a record to signify the start of the onboarding process
            try:
                start_data = {
                    "discord_user_id": discord_user_id,
                    "discord_username": discord_username,
                    "campaign": document_id,
                    "started_at": datetime.now(timezone.utc).isoformat()
                }
                await strapi_client.create_onboarding_start(start_data)
                logger.info(f"Successfully created onboarding_start record for user {discord_user_id} on campaign {document_id}")
            except Exception as e:
                # Log a warning but don't fail the entire process
                logger.warning(f"Could not create onboarding_start record for user {discord_user_id} on campaign {document_id}: {e}")

            # Fetch onboarding fields from Strapi using documentId
            fields_data = await strapi_client.get_onboarding_fields(document_id)
            
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
            # First, check if campaign_id is numeric ID or documentId
            # If it's numeric, we need to get the campaign first to get its documentId
            document_id = campaign_id
            
            # If campaign_id looks like a numeric ID, fetch the campaign to get its documentId
            if campaign_id.isdigit():
                logger.info(f"Campaign ID {campaign_id} appears to be numeric, fetching campaign to get documentId")
                campaigns = await strapi_client.get_campaigns({"filters[id][$eq]": campaign_id})
                if campaigns:
                    document_id = getattr(campaigns[0], 'documentId', None)
                    logger.info(f"Found documentId {document_id} for campaign ID {campaign_id}")
                else:
                    logger.error(f"Campaign with ID {campaign_id} not found")
                    return {"success": False, "message": "Campaign not found"}
            
            # Save each onboarding response
            for field_key, field_value in responses.items():
                response_data = {
                    "discord_user_id": discord_user_id,
                    "discord_username": discord_username,
                    "field_key": field_key,
                    "field_value": field_value,
                    "campaign": document_id
                }
                await strapi_client.create_onboarding_response(response_data)

            # Create a single record to mark the onboarding as complete
            completion_data = {
                "discord_user_id": discord_user_id,
                "discord_username": discord_username,
                "campaign": document_id,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            await strapi_client.create_onboarding_completion(completion_data)

            # Update campaign statistics (increment successful_onboardings)
            try:
                campaign_data = await strapi_client.get_campaign(document_id)  # Use documentId here
                if campaign_data:
                    current_count = getattr(campaign_data, 'successful_onboardings', 0)
                    update_data = {
                        "successful_onboardings": current_count + 1
                    }
                    logger.info(f"IntegrationService: Preparing to update campaign {document_id} with data: {update_data}")
                    await strapi_client.update_campaign(document_id, update_data)
            except Exception as stats_error:
                logger.warning(f"Failed to update campaign statistics: {stats_error}")
                # Don't fail the entire operation if statistics update fails
            
            # Assign Discord role if configured
            role_assigned = False
            if getattr(campaign_data, 'auto_role_assignment', False) and getattr(campaign_data, 'target_role_ids', None):
                guild_id = getattr(campaign_data, 'guild_id', None)
                for role_id in campaign_data.target_role_ids:
                    role_assigned = await self._assign_discord_role(guild_id, discord_user_id, role_id)
                    if not role_assigned:
                        logger.warning(f"Failed to assign role {role_id} to user {discord_user_id}")

            logger.info(f"Discord onboarding completed for user {discord_user_id} on campaign {campaign_id}")
            return {"success": True, "message": "Onboarding completed successfully!", "role_assigned": role_assigned}
            
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

    async def _assign_discord_role(self, guild_id: str, user_id: str, role_id: str) -> bool:
        """
        Assigns a role to a user in a specific guild using the Discord API.
        """
        if not settings.DISCORD_BOT_TOKEN:
            logger.warning("DISCORD_BOT_TOKEN is not configured. Cannot assign roles.")
            return False

        url = f"https://discord.com/api/v10/guilds/{guild_id}/members/{user_id}/roles/{role_id}"
        headers = {
            "Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.put(url, headers=headers)
                response.raise_for_status()
                logger.info(f"Successfully assigned role {role_id} to user {user_id} in guild {guild_id}")
                return True
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to assign role {role_id} to user {user_id} in guild {guild_id}. Status: {e.response.status_code}, Response: {e.response.text}")
                return False
            except Exception as e:
                logger.error(f"An unexpected error occurred while assigning a Discord role: {e}")
                return False

integration_service = IntegrationService()