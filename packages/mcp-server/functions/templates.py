"""Template management functions."""

import asyncio
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware
from server import token_context


async def list_campaign_templates(_params: dict) -> dict:
    """Lists all campaign templates."""
    try:
        token = token_context.get()
        result = await api_client._make_request("GET", "/api/campaign-templates", token=token)
        return result
    except Exception as e:
        logger.error(f"Error listing campaign templates: {e}")
        return {"error": str(e)}


async def get_campaign_template(params: dict) -> dict:
    """Gets a specific campaign template by ID."""
    try:
        token = token_context.get()
        template_id = params["template_id"]
        result = await api_client._make_request("GET", f"/api/campaign-templates/{template_id}", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting campaign template: {e}")
        return {"error": str(e)}


async def create_campaign_template(params: dict) -> dict:
    """Creates a new campaign template."""
    try:
        token = token_context.get()
        data = {
            "name": params["name"],
            "description": params.get("description"),
            "template_data": params["template_data"],
            "category": params.get("category"),
            "is_public": params.get("is_public", False)
        }
        
        result = await api_client._make_request("POST", "/api/campaign-templates", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error creating campaign template: {e}")
        return {"error": str(e)}


async def update_campaign_template(params: dict) -> dict:
    """Updates an existing campaign template."""
    try:
        token = token_context.get()
        template_id = params["template_id"]
        updates = params["updates"]
        
        result = await api_client._make_request("PATCH", f"/api/campaign-templates/{template_id}", data=updates, token=token)
        return result
    except Exception as e:
        logger.error(f"Error updating campaign template: {e}")
        return {"error": str(e)}


async def delete_campaign_template(params: dict) -> dict:
    """Deletes a campaign template."""
    try:
        token = token_context.get()
        template_id = params["template_id"]
        result = await api_client._make_request("DELETE", f"/api/campaign-templates/{template_id}", token=token)
        return result
    except Exception as e:
        logger.error(f"Error deleting campaign template: {e}")
        return {"error": str(e)}


async def list_landing_page_templates(_params: dict) -> dict:
    """Lists all landing page templates."""
    try:
        token = token_context.get()
        result = await api_client._make_request("GET", "/api/landing-page-templates", token=token)
        return result
    except Exception as e:
        logger.error(f"Error listing landing page templates: {e}")
        return {"error": str(e)}


async def apply_onboarding_template(params: dict) -> dict:
    """Applies a template to campaign onboarding fields."""
    try:
        token = token_context.get()
        data = {
            "template_id": params["template_id"],
            "campaign_id": params["campaign_id"],
            "overrides": params.get("overrides", {})
        }
        
        result = await api_client._make_request("POST", "/api/campaign-onboarding-fields/apply-template", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error applying onboarding template: {e}")
        return {"error": str(e)}


class TemplatesPlugin(PluginBase):
    """Plugin for template management functions."""
    
    @property
    def category(self) -> str:
        return "templates"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="list_campaign_templates",
                func=apply_middleware(list_campaign_templates),
                category=self.category,
                description="Lists all campaign templates",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="get_campaign_template",
                func=apply_middleware(get_campaign_template, [
                    validation_middleware(["template_id"])
                ]),
                category=self.category,
                description="Gets a specific campaign template by ID",
                schema={
                    "type": "object",
                    "properties": {
                        "template_id": {"type": "string", "description": "Template UUID"}
                    },
                    "required": ["template_id"]
                }
            ),
            FunctionSpec(
                name="create_campaign_template",
                func=apply_middleware(create_campaign_template, [
                    validation_middleware(["name", "template_data"])
                ]),
                category=self.category,
                description="Creates a new campaign template",
                schema={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Template name"},
                        "description": {"type": "string", "description": "Template description"},
                        "template_data": {
                            "type": "object",
                            "description": "Template configuration data"
                        },
                        "category": {"type": "string", "description": "Template category"},
                        "is_public": {"type": "boolean", "description": "Whether template is public", "default": False}
                    },
                    "required": ["name", "template_data"]
                }
            ),
            FunctionSpec(
                name="update_campaign_template",
                func=apply_middleware(update_campaign_template, [
                    validation_middleware(["template_id", "updates"])
                ]),
                category=self.category,
                description="Updates an existing campaign template",
                schema={
                    "type": "object",
                    "properties": {
                        "template_id": {"type": "string", "description": "Template UUID"},
                        "updates": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "description": {"type": "string"},
                                "template_data": {"type": "object"},
                                "category": {"type": "string"},
                                "is_public": {"type": "boolean"}
                            },
                            "description": "Fields to update"
                        }
                    },
                    "required": ["template_id", "updates"]
                }
            ),
            FunctionSpec(
                name="delete_campaign_template",
                func=apply_middleware(delete_campaign_template, [
                    validation_middleware(["template_id"])
                ]),
                category=self.category,
                description="Deletes a campaign template",
                schema={
                    "type": "object",
                    "properties": {
                        "template_id": {"type": "string", "description": "Template UUID"}
                    },
                    "required": ["template_id"]
                }
            ),
            FunctionSpec(
                name="list_landing_page_templates",
                func=apply_middleware(list_landing_page_templates),
                category=self.category,
                description="Lists all landing page templates",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="apply_onboarding_template",
                func=apply_middleware(apply_onboarding_template, [
                    validation_middleware(["template_id", "campaign_id"])
                ]),
                category=self.category,
                description="Applies a template to campaign onboarding fields",
                schema={
                    "type": "object",
                    "properties": {
                        "template_id": {"type": "string", "description": "Template UUID"},
                        "campaign_id": {"type": "string", "description": "Campaign UUID"},
                        "overrides": {
                            "type": "object",
                            "description": "Template field overrides"
                        }
                    },
                    "required": ["template_id", "campaign_id"]
                }
            )
        ]


def get_plugin() -> TemplatesPlugin:
    """Get the templates plugin instance."""
    return TemplatesPlugin()