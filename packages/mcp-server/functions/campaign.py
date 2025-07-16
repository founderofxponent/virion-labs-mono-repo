"""Campaign management functions."""

import asyncio
from datetime import datetime
from typing import List
from functions.base import api_client, logger, CampaignType
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


async def create_campaign(params: dict) -> dict:
    """Creates a new campaign in the Virion Labs platform."""
    try:
        campaign_data = {
            "name": params["name"],
            "description": params.get("description"),
            "discord_guild_id": params["discord_server_id"],
            "discord_channel_id": params.get("primary_channel_id"),
            "is_active": True,
            "onboarding_config": {
                "bot_name": params.get("bot_name"),
                "bot_avatar_url": params.get("bot_logo_url"),
                "brand_color": params.get("brand_color"),
                "bot_personality": params.get("bot_personality"),
                "bot_response_style": params.get("bot_response_style"),
                "welcome_message": params.get("welcome_message"),
                "onboarding_questions": params.get("onboarding_questions", []),
                "auto_role_assignment": params.get("auto_role_assignment", False),
                "target_role_id": params.get("target_role_id"),
                "moderation_enabled": params.get("enable_moderation", False),
                "rate_limit_per_user": params.get("interactions_per_user", 10),
                "referral_tracking_enabled": params.get("enable_referral_system", False),
                "webhook_url": params.get("webhook_url")
            },
            "landing_page_config": {
                "campaign_type": params.get("campaign_type"),
                "start_date": params.get("start_date"),
                "end_date": params.get("end_date")
            }
        }
        
        result = await api_client.create_campaign(campaign_data)
        return result
    except Exception as e:
        logger.error(f"Error creating campaign: {e}")
        return {"error": str(e)}


async def update_campaign(params: dict) -> dict:
    """Updates an existing campaign in the Virion Labs platform."""
    try:
        campaign_id = params["campaign_id"]
        updates = params["updates"]
        
        # Map old field names to new API field names
        mapped_updates = {}
        if "name" in updates:
            mapped_updates["name"] = updates["name"]
        if "description" in updates:
            mapped_updates["description"] = updates["description"]
        if "discord_channel_id" in updates:
            mapped_updates["discord_channel_id"] = updates["discord_channel_id"]
        if "is_active" in updates:
            mapped_updates["is_active"] = updates["is_active"]
        
        # Handle onboarding config updates
        onboarding_updates = {}
        if any(key in updates for key in ["bot_name", "bot_logo_url", "brand_color", "bot_personality", "bot_response_style", "welcome_message", "onboarding_questions", "auto_role_assignment", "target_role_id", "enable_moderation", "interactions_per_user", "enable_referral_system", "webhook_url"]):
            onboarding_updates = {
                "bot_name": updates.get("bot_name"),
                "bot_avatar_url": updates.get("bot_logo_url"),
                "brand_color": updates.get("brand_color"),
                "bot_personality": updates.get("bot_personality"),
                "bot_response_style": updates.get("bot_response_style"),
                "welcome_message": updates.get("welcome_message"),
                "onboarding_questions": updates.get("onboarding_questions"),
                "auto_role_assignment": updates.get("auto_role_assignment"),
                "target_role_id": updates.get("target_role_id"),
                "moderation_enabled": updates.get("enable_moderation"),
                "rate_limit_per_user": updates.get("interactions_per_user"),
                "referral_tracking_enabled": updates.get("enable_referral_system"),
                "webhook_url": updates.get("webhook_url")
            }
            mapped_updates["onboarding_config"] = onboarding_updates
        
        # Handle landing page config updates
        landing_updates = {}
        if any(key in updates for key in ["campaign_type", "start_date", "end_date"]):
            landing_updates = {
                "campaign_type": updates.get("campaign_type"),
                "start_date": updates.get("start_date"),
                "end_date": updates.get("end_date")
            }
            mapped_updates["landing_page_config"] = landing_updates
        
        result = await api_client.update_campaign(campaign_id, mapped_updates)
        return result
    except Exception as e:
        logger.error(f"Error updating campaign: {e}")
        return {"error": str(e)}


async def delete_campaign(params: dict) -> dict:
    """Deletes a campaign by marking it as inactive."""
    try:
        campaign_id = params["campaign_id"]
        result = await api_client.delete_campaign(campaign_id)
        return result
    except Exception as e:
        logger.error(f"Error deleting campaign: {e}")
        return {"error": str(e)}


async def set_campaign_status(params: dict) -> dict:
    """Sets the status of a campaign."""
    try:
        campaign_id = params["campaign_id"]
        status = params["status"]
        
        if status not in ["active", "paused", "archived"]:
            return {"error": "Invalid status. Must be one of 'active', 'paused', or 'archived'."}
        
        updates = {"is_active": status == "active"}
        result = await api_client.update_campaign(campaign_id, updates)
        return result
    except Exception as e:
        logger.error(f"Error setting campaign status: {e}")
        return {"error": str(e)}


async def list_available_campaigns(_params: dict) -> dict:
    """Retrieves a list of all active campaigns available to influencers."""
    try:
        campaigns = await api_client.list_campaigns()
        return {"campaigns": campaigns}
    except Exception as e:
        logger.error(f"Error listing available campaigns: {e}")
        return {"error": str(e)}


async def get_campaign(params: dict) -> dict:
    """Gets a specific campaign by ID."""
    try:
        campaign_id = params["campaign_id"]
        result = await api_client.get_campaign(campaign_id)
        return result
    except Exception as e:
        logger.error(f"Error getting campaign: {e}")
        return {"error": str(e)}


async def update_campaign_stats(params: dict) -> dict:
    """Updates campaign statistics."""
    try:
        campaign_id = params["campaign_id"]
        stats = {
            "view_count": params.get("view_count"),
            "join_count": params.get("join_count"),
            "additional_stats": params.get("additional_stats")
        }
        result = await api_client.update_campaign_stats(campaign_id, stats)
        return result
    except Exception as e:
        logger.error(f"Error updating campaign stats: {e}")
        return {"error": str(e)}


class CampaignPlugin(PluginBase):
    """Plugin for campaign management functions."""
    
    @property
    def category(self) -> str:
        return "campaign"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="create_campaign",
                func=apply_middleware(create_campaign, [
                    validation_middleware(["name", "discord_server_id"])
                ]),
                category=self.category,
                description="Creates a new campaign in the Virion Labs platform",
                schema={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Campaign name"},
                        "discord_server_id": {"type": "string", "description": "Discord server ID"},
                        "primary_channel_id": {"type": "string", "description": "Primary Discord channel ID"},
                        "description": {"type": "string", "description": "Campaign description"},
                        "campaign_type": {"type": "string", "enum": ["influencer_marketing", "brand_awareness", "product_launch"], "description": "Type of campaign"},
                        "start_date": {"type": "string", "format": "date", "description": "Campaign start date (YYYY-MM-DD)"},
                        "end_date": {"type": "string", "format": "date", "description": "Campaign end date (YYYY-MM-DD)"},
                        "bot_name": {"type": "string", "description": "Bot display name"},
                        "bot_logo_url": {"type": "string", "format": "uri", "description": "Bot avatar URL"},
                        "brand_color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$", "description": "Brand color in hex format"},
                        "bot_personality": {"type": "string", "description": "Bot personality description"},
                        "bot_response_style": {"type": "string", "description": "Bot response style"},
                        "welcome_message": {"type": "string", "description": "Welcome message for new users"},
                        "onboarding_questions": {"type": "array", "items": {"type": "string"}, "description": "List of onboarding questions"},
                        "auto_role_assignment": {"type": "boolean", "description": "Enable automatic role assignment"},
                        "target_role_id": {"type": "string", "description": "Target role ID for assignment"},
                        "enable_moderation": {"type": "boolean", "description": "Enable moderation features"},
                        "interactions_per_user": {"type": "integer", "minimum": 1, "description": "Rate limit per user"},
                        "enable_referral_system": {"type": "boolean", "description": "Enable referral tracking"},
                        "webhook_url": {"type": "string", "format": "uri", "description": "Webhook URL for notifications"}
                    },
                    "required": ["name", "discord_server_id"]
                }
            ),
            FunctionSpec(
                name="update_campaign",
                func=apply_middleware(update_campaign, [
                    validation_middleware(["campaign_id", "updates"])
                ]),
                category=self.category,
                description="Updates an existing campaign",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"},
                        "updates": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "description": {"type": "string"},
                                "campaign_type": {"type": "string", "enum": ["influencer_marketing", "brand_awareness", "product_launch"]},
                                "start_date": {"type": "string", "format": "date"},
                                "end_date": {"type": "string", "format": "date"},
                                "bot_name": {"type": "string"},
                                "bot_logo_url": {"type": "string", "format": "uri"},
                                "brand_color": {"type": "string", "pattern": "^#[0-9A-Fa-f]{6}$"},
                                "bot_personality": {"type": "string"},
                                "bot_response_style": {"type": "string"},
                                "welcome_message": {"type": "string"},
                                "onboarding_questions": {"type": "array", "items": {"type": "string"}},
                                "auto_role_assignment": {"type": "boolean"},
                                "target_role_id": {"type": "string"},
                                "enable_moderation": {"type": "boolean"},
                                "interactions_per_user": {"type": "integer"},
                                "enable_referral_system": {"type": "boolean"},
                                "webhook_url": {"type": "string", "format": "uri"}
                            },
                            "description": "Object containing fields to update"
                        }
                    },
                    "required": ["campaign_id", "updates"]
                }
            ),
            FunctionSpec(
                name="delete_campaign",
                func=apply_middleware(delete_campaign, [
                    validation_middleware(["campaign_id"])
                ]),
                category=self.category,
                description="Deletes a campaign",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"}
                    },
                    "required": ["campaign_id"]
                }
            ),
            FunctionSpec(
                name="set_campaign_status",
                func=apply_middleware(set_campaign_status, [
                    validation_middleware(["campaign_id", "status"])
                ]),
                category=self.category,
                description="Sets the status of a campaign",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"},
                        "status": {"type": "string", "enum": ["active", "paused", "archived"], "description": "Campaign status"}
                    },
                    "required": ["campaign_id", "status"]
                }
            ),
            FunctionSpec(
                name="list_available_campaigns",
                func=apply_middleware(list_available_campaigns),
                category=self.category,
                description="Lists all available campaigns",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="get_campaign",
                func=apply_middleware(get_campaign, [
                    validation_middleware(["campaign_id"])
                ]),
                category=self.category,
                description="Gets a specific campaign",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"}
                    },
                    "required": ["campaign_id"]
                }
            ),
            FunctionSpec(
                name="update_campaign_stats",
                func=apply_middleware(update_campaign_stats, [
                    validation_middleware(["campaign_id"])
                ]),
                category=self.category,
                description="Updates campaign statistics",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"},
                        "view_count": {"type": "integer", "description": "Number of views"},
                        "join_count": {"type": "integer", "description": "Number of joins"},
                        "additional_stats": {"type": "object", "description": "Additional statistics"}
                    },
                    "required": ["campaign_id"]
                }
            )
        ]


def get_plugin() -> CampaignPlugin:
    """Get the campaign plugin instance."""
    return CampaignPlugin()