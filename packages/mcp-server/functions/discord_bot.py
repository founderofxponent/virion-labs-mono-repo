"""Discord bot management functions."""

import asyncio
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware
from server import token_context


async def start_onboarding(params: dict) -> dict:
    """Starts Discord bot onboarding process."""
    try:
        token = token_context.get()
        data = {
            "guild_id": params["guild_id"],
            "user_id": params["user_id"],
            "campaign_id": params.get("campaign_id"),
            "referral_code": params.get("referral_code")
        }
        
        result = await api_client.start_onboarding(data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error starting onboarding: {e}")
        return {"error": str(e)}


async def submit_onboarding_modal(params: dict) -> dict:
    """Submits Discord bot onboarding modal data."""
    try:
        token = token_context.get()
        data = {
            "session_id": params["session_id"],
            "responses": params["responses"]
        }
        
        result = await api_client.submit_onboarding_modal(data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error submitting onboarding modal: {e}")
        return {"error": str(e)}


async def get_onboarding_session(params: dict) -> dict:
    """Gets Discord bot onboarding session data."""
    try:
        token = token_context.get()
        session_id = params["session_id"]
        result = await api_client.get_onboarding_session(session_id, token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting onboarding session: {e}")
        return {"error": str(e)}


async def complete_onboarding(params: dict) -> dict:
    """Completes Discord bot onboarding process."""
    try:
        token = token_context.get()
        data = {
            "session_id": params["session_id"],
            "user_id": params["user_id"],
            "guild_id": params["guild_id"]
        }
        
        result = await api_client.complete_onboarding(data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}")
        return {"error": str(e)}


async def get_discord_config(params: dict) -> dict:
    """Gets Discord bot configuration."""
    try:
        token = token_context.get()
        guild_id = params.get("guild_id")
        campaign_id = params.get("campaign_id")
        
        query_params = []
        if guild_id:
            query_params.append(f"guild_id={guild_id}")
        if campaign_id:
            query_params.append(f"campaign_id={campaign_id}")
        
        query_string = "&".join(query_params)
        endpoint = f"/api/discord-bot/config"
        if query_string:
            endpoint += f"?{query_string}"
        
        result = await api_client.get_discord_config(guild_id, token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting Discord config: {e}")
        return {"error": str(e)}


async def get_invite_context(params: dict) -> dict:
    """Gets Discord invite context information."""
    try:
        token = token_context.get()
        invite_code = params["invite_code"]
        result = await api_client._make_request("GET", f"/api/discord-bot/discord/invite/{invite_code}/context", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting invite context: {e}")
        return {"error": str(e)}


async def assign_member_role(params: dict) -> dict:
    """Assigns a role to a Discord guild member."""
    try:
        token = token_context.get()
        guild_id = params["guild_id"]
        member_id = params["member_id"]
        data = {
            "role_id": params["role_id"],
            "reason": params.get("reason", "Role assigned via MCP")
        }
        
        result = await api_client.assign_discord_role(guild_id, member_id, data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error assigning member role: {e}")
        return {"error": str(e)}


async def get_member_roles(params: dict) -> dict:
    """Gets roles for a Discord guild member."""
    try:
        token = token_context.get()
        guild_id = params["guild_id"]
        member_id = params["member_id"]
        
        result = await api_client.get_member_roles(guild_id, member_id, token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting member roles: {e}")
        return {"error": str(e)}


class DiscordBotPlugin(PluginBase):
    """Plugin for Discord bot management functions."""
    
    @property
    def category(self) -> str:
        return "discord_bot"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="start_onboarding",
                func=apply_middleware(start_onboarding, [
                    validation_middleware(["guild_id", "user_id"])
                ]),
                category=self.category,
                description="Starts Discord bot onboarding process",
                schema={
                    "type": "object",
                    "properties": {
                        "guild_id": {"type": "string", "description": "Discord Guild ID"},
                        "user_id": {"type": "string", "description": "Discord User ID"},
                        "campaign_id": {"type": "string", "description": "Optional Campaign UUID"},
                        "referral_code": {"type": "string", "description": "Optional referral code"}
                    },
                    "required": ["guild_id", "user_id"]
                }
            ),
            FunctionSpec(
                name="submit_onboarding_modal",
                func=apply_middleware(submit_onboarding_modal, [
                    validation_middleware(["session_id", "responses"])
                ]),
                category=self.category,
                description="Submits Discord bot onboarding modal data",
                schema={
                    "type": "object",
                    "properties": {
                        "session_id": {"type": "string", "description": "Onboarding session ID"},
                        "responses": {
                            "type": "object",
                            "description": "User responses to onboarding questions"
                        }
                    },
                    "required": ["session_id", "responses"]
                }
            ),
            FunctionSpec(
                name="get_onboarding_session",
                func=apply_middleware(get_onboarding_session, [
                    validation_middleware(["session_id"])
                ]),
                category=self.category,
                description="Gets Discord bot onboarding session data",
                schema={
                    "type": "object",
                    "properties": {
                        "session_id": {"type": "string", "description": "Onboarding session ID"}
                    },
                    "required": ["session_id"]
                }
            ),
            FunctionSpec(
                name="complete_onboarding",
                func=apply_middleware(complete_onboarding, [
                    validation_middleware(["session_id", "user_id", "guild_id"])
                ]),
                category=self.category,
                description="Completes Discord bot onboarding process",
                schema={
                    "type": "object",
                    "properties": {
                        "session_id": {"type": "string", "description": "Onboarding session ID"},
                        "user_id": {"type": "string", "description": "Discord User ID"},
                        "guild_id": {"type": "string", "description": "Discord Guild ID"}
                    },
                    "required": ["session_id", "user_id", "guild_id"]
                }
            ),
            FunctionSpec(
                name="get_discord_config",
                func=apply_middleware(get_discord_config),
                category=self.category,
                description="Gets Discord bot configuration",
                schema={
                    "type": "object",
                    "properties": {
                        "guild_id": {"type": "string", "description": "Optional Discord Guild ID"},
                        "campaign_id": {"type": "string", "description": "Optional Campaign UUID"}
                    },
                    "description": "All parameters are optional"
                }
            ),
            FunctionSpec(
                name="get_invite_context",
                func=apply_middleware(get_invite_context, [
                    validation_middleware(["invite_code"])
                ]),
                category=self.category,
                description="Gets Discord invite context information",
                schema={
                    "type": "object",
                    "properties": {
                        "invite_code": {"type": "string", "description": "Discord invite code"}
                    },
                    "required": ["invite_code"]
                }
            ),
            FunctionSpec(
                name="assign_member_role",
                func=apply_middleware(assign_member_role, [
                    validation_middleware(["guild_id", "member_id", "role_id"])
                ]),
                category=self.category,
                description="Assigns a role to a Discord guild member",
                schema={
                    "type": "object",
                    "properties": {
                        "guild_id": {"type": "string", "description": "Discord Guild ID"},
                        "member_id": {"type": "string", "description": "Discord Member ID"},
                        "role_id": {"type": "string", "description": "Discord Role ID"},
                        "reason": {"type": "string", "description": "Optional reason for role assignment"}
                    },
                    "required": ["guild_id", "member_id", "role_id"]
                }
            ),
            FunctionSpec(
                name="get_member_roles",
                func=apply_middleware(get_member_roles, [
                    validation_middleware(["guild_id", "member_id"])
                ]),
                category=self.category,
                description="Gets roles for a Discord guild member",
                schema={
                    "type": "object",
                    "properties": {
                        "guild_id": {"type": "string", "description": "Discord Guild ID"},
                        "member_id": {"type": "string", "description": "Discord Member ID"}
                    },
                    "required": ["guild_id", "member_id"]
                }
            )
        ]


def get_plugin() -> DiscordBotPlugin:
    """Get the Discord bot plugin instance."""
    return DiscordBotPlugin()