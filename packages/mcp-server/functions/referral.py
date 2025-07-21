"""Referral link management functions."""

import asyncio
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware
from server import token_context


async def create_referral_link(params: dict) -> dict:
    """Creates a new referral link for a campaign."""
    try:
        token = token_context.get()
        campaign_id = params["campaign_id"]
        data = {
            "title": params.get("title", "Default Link"),
            "platform": params.get("platform", "Other")
        }
        
        result = await api_client._make_request("POST", f"/api/campaigns/{campaign_id}/referral-links", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error creating referral link: {e}")
        return {"error": str(e)}


async def get_my_referral_links(params: dict) -> dict:
    """Retrieves a list of all referral links for a campaign."""
    try:
        token = token_context.get()
        campaign_id = params["campaign_id"]
        result = await api_client._make_request("GET", f"/api/campaigns/{campaign_id}/referral-links", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting referral links: {e}")
        return {"error": str(e)}


async def validate_referral_code(params: dict) -> dict:
    """Validates a referral code."""
    try:
        token = token_context.get()
        referral_code = params["referral_code"]
        result = await api_client.validate_referral_code(referral_code, token=token)
        return result
    except Exception as e:
        logger.error(f"Error validating referral code: {e}")
        return {"error": str(e)}


async def get_referral_campaign_info(params: dict) -> dict:
    """Gets campaign information for a referral code."""
    try:
        token = token_context.get()
        referral_code = params["referral_code"]
        result = await api_client.get_referral_campaign_info(referral_code, token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting referral campaign info: {e}")
        return {"error": str(e)}


async def process_referral_signup(params: dict) -> dict:
    """Processes a referral signup."""
    try:
        token = token_context.get()
        data = {
            "referral_code": params["referral_code"],
            "user_email": params["user_email"],
            "user_data": params.get("user_data", {})
        }
        
        result = await api_client.process_referral_signup(data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error processing referral signup: {e}")
        return {"error": str(e)}


async def complete_referral(params: dict) -> dict:
    """Completes a referral process."""
    try:
        token = token_context.get()
        data = {
            "referral_code": params["referral_code"],
            "user_id": params["user_id"],
            "completion_data": params.get("completion_data", {})
        }
        
        result = await api_client.complete_referral(data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error completing referral: {e}")
        return {"error": str(e)}


class ReferralPlugin(PluginBase):
    """Plugin for referral link management functions."""
    
    @property
    def category(self) -> str:
        return "referral"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="create_referral_link",
                func=apply_middleware(create_referral_link, [
                    validation_middleware(["campaign_id"])
                ]),
                category=self.category,
                description="Creates a new referral link",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"},
                        "title": {"type": "string", "description": "Title for the referral link"},
                        "platform": {"type": "string", "description": "Platform for the referral link"}
                    },
                    "required": ["campaign_id"]
                }
            ),
            FunctionSpec(
                name="get_my_referral_links",
                func=apply_middleware(get_my_referral_links, [
                    validation_middleware(["campaign_id"])
                ]),
                category=self.category,
                description="Gets all referral links for a campaign",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"}
                    },
                    "required": ["campaign_id"]
                }
            ),
            FunctionSpec(
                name="validate_referral_code",
                func=apply_middleware(validate_referral_code, [
                    validation_middleware(["referral_code"])
                ]),
                category=self.category,
                description="Validates a referral code",
                schema={
                    "type": "object",
                    "properties": {
                        "referral_code": {"type": "string", "description": "Referral code to validate"}
                    },
                    "required": ["referral_code"]
                }
            ),
            FunctionSpec(
                name="get_referral_campaign_info",
                func=apply_middleware(get_referral_campaign_info, [
                    validation_middleware(["referral_code"])
                ]),
                category=self.category,
                description="Gets campaign information for a referral code",
                schema={
                    "type": "object",
                    "properties": {
                        "referral_code": {"type": "string", "description": "Referral code"}
                    },
                    "required": ["referral_code"]
                }
            ),
            FunctionSpec(
                name="process_referral_signup",
                func=apply_middleware(process_referral_signup, [
                    validation_middleware(["referral_code", "user_email"])
                ]),
                category=self.category,
                description="Processes a referral signup",
                schema={
                    "type": "object",
                    "properties": {
                        "referral_code": {"type": "string", "description": "Referral code"},
                        "user_email": {"type": "string", "format": "email", "description": "User email"},
                        "user_data": {"type": "object", "description": "Additional user data"}
                    },
                    "required": ["referral_code", "user_email"]
                }
            ),
            FunctionSpec(
                name="complete_referral",
                func=apply_middleware(complete_referral, [
                    validation_middleware(["referral_code", "user_id"])
                ]),
                category=self.category,
                description="Completes a referral process",
                schema={
                    "type": "object",
                    "properties": {
                        "referral_code": {"type": "string", "description": "Referral code"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "completion_data": {"type": "object", "description": "Completion data"}
                    },
                    "required": ["referral_code", "user_id"]
                }
            )
        ]


def get_plugin() -> ReferralPlugin:
    """Get the referral plugin instance."""
    return ReferralPlugin()