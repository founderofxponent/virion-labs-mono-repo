"""Campaign management functions."""

from datetime import datetime
from typing import List
from functions.base import supabase, logger, CampaignType
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


def create_campaign(params: dict) -> dict:
    """Creates a new campaign in the Virion Labs platform."""
    try:
        client_response = supabase.table("clients").select("id").eq("name", params["client"]).limit(1).execute()
        if not client_response.data:
            return {"error": f"Client '{params['client']}' not found."}
        client_id = client_response.data[0]['id']
        
        campaign_data = {
            "client_id": client_id,
            "guild_id": params["discord_server_id"],
            "channel_id": params["primary_channel_id"],
            "campaign_name": params["name"],
            "campaign_type": params["campaign_type"],
            "description": params["description"],
            "campaign_start_date": params["start_date"],
            "campaign_end_date": params["end_date"],
            "bot_name": params["bot_name"],
            "bot_avatar_url": params["bot_logo_url"],
            "brand_color": params["brand_color"],
            "bot_personality": params["bot_personality"],
            "bot_response_style": params["bot_response_style"],
            "welcome_message": params["welcome_message"],
            "onboarding_flow": params["onboarding_questions"],
            "auto_role_assignment": params["auto_role_assignment"],
            "target_role_ids": [params["target_role_id"]] if params["target_role_id"] else [],
            "moderation_enabled": params["enable_moderation"],
            "rate_limit_per_user": params["interactions_per_user"],
            "referral_tracking_enabled": params["enable_referral_system"],
            "webhook_url": params["webhook_url"],
            "is_active": True
        }
        response = supabase.table("discord_guild_campaigns").insert(campaign_data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating campaign: {e}")
        return {"error": str(e)}


def update_campaign(params: dict) -> dict:
    """Updates an existing campaign in the Virion Labs platform."""
    try:
        campaign_id = params["campaign_id"]
        updates = params["updates"]
        
        if 'id' in updates:
            return {"error": "Cannot change the campaign ID."}
        
        if 'campaign_type' in updates:
            try:
                CampaignType(updates['campaign_type'])
            except ValueError:
                allowed_types = [e.value for e in CampaignType]
                return {"error": f"Invalid campaign_type. Must be one of: {allowed_types}"}

        updates["updated_at"] = datetime.now().isoformat()
        response = supabase.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
        return response.data[0] if response.data else {"error": "Campaign not found"}
    except Exception as e:
        logger.error(f"Error updating campaign: {e}")
        return {"error": str(e)}


def delete_campaign(params: dict) -> dict:
    """Deletes a campaign by marking it as inactive and deleted (soft delete)."""
    try:
        campaign_id = params["campaign_id"]
        update_data = {
            "is_active": False,
            "is_deleted": True,
            "deleted_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        response = supabase.table("discord_guild_campaigns").update(update_data).eq("id", campaign_id).execute()
        return response.data[0] if response.data else {"error": "Campaign not found"}
    except Exception as e:
        logger.error(f"Error deleting campaign: {e}")
        return {"error": str(e)}


def set_campaign_status(params: dict) -> dict:
    """Sets the status of a campaign."""
    campaign_id = params["campaign_id"]
    status = params["status"]
    
    if status not in ["active", "paused", "archived"]:
        return {"error": "Invalid status. Must be one of 'active', 'paused', or 'archived'."}
    
    try:
        update_data = {
            "is_active": status == "active",
            "updated_at": datetime.now().isoformat()
        }
        if status == "paused":
            update_data["paused_at"] = datetime.now().isoformat()
        else:
            update_data["paused_at"] = None

        if status == "archived":
            update_data["is_deleted"] = True
            update_data["deleted_at"] = datetime.now().isoformat()
        
        response = supabase.table("discord_guild_campaigns").update(update_data).eq("id", campaign_id).execute()
        return response.data[0] if response.data else {"error": "Campaign not found"}
    except Exception as e:
        logger.error(f"Error setting campaign status: {e}")
        return {"error": str(e)}


def list_available_campaigns(_params: dict) -> dict:
    """Retrieves a list of all active campaigns available to influencers."""
    try:
        response = supabase.table("discord_guild_campaigns").select("*").eq("is_active", True).execute()
        return {"campaigns": response.data}
    except Exception as e:
        logger.error(f"Error listing available campaigns: {e}")
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
                    validation_middleware(["client", "discord_server_id", "name"])
                ]),
                category=self.category,
                description="Creates a new campaign in the Virion Labs platform",
                schema={
                    "type": "object",
                    "properties": {
                        "client": {"type": "string", "description": "Client company name"},
                        "discord_server_id": {"type": "string", "description": "Discord server ID"},
                        "primary_channel_id": {"type": "string", "description": "Primary Discord channel ID"},
                        "name": {"type": "string", "description": "Campaign name"},
                        "campaign_type": {"type": "string", "enum": ["influencer_marketing", "brand_awareness", "product_launch"], "description": "Type of campaign"},
                        "description": {"type": "string", "description": "Campaign description"},
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
                    "required": ["client", "discord_server_id", "name"]
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
                                "interactions_per_user": {"type": "integer", "minimum": 1},
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
                description="Deletes a campaign (soft delete)",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID to delete"}
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
                description="Sets campaign status (active/paused/archived)",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"},
                        "status": {"type": "string", "enum": ["active", "paused", "archived"], "description": "New campaign status"}
                    },
                    "required": ["campaign_id", "status"]
                }
            ),
            FunctionSpec(
                name="list_available_campaigns",
                func=apply_middleware(list_available_campaigns),
                category=self.category,
                description="Lists all active campaigns",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            )
        ]


def get_plugin() -> CampaignPlugin:
    """Get the campaign plugin instance."""
    return CampaignPlugin()