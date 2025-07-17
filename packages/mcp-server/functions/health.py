"""Health and status monitoring functions."""

import asyncio
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


async def get_health_status(_params: dict) -> dict:
    """Gets the health status of the API server."""
    try:
        result = await api_client._make_request("GET", "/health")
        return result
    except Exception as e:
        logger.error(f"Error getting health status: {e}")
        return {"error": str(e)}


async def get_status_health(_params: dict) -> dict:
    """Gets the status health check of the API server."""
    try:
        result = await api_client._make_request("GET", "/status/health")
        return result
    except Exception as e:
        logger.error(f"Error getting status health: {e}")
        return {"error": str(e)}


async def submit_access_request(params: dict) -> dict:
    """Submits an access request to the system."""
    try:
        data = {
            "email": params["email"],
            "reason": params.get("reason", ""),
            "organization": params.get("organization"),
            "use_case": params.get("use_case")
        }
        
        result = await api_client._make_request("POST", "/api/access-requests/", data=data)
        return result
    except Exception as e:
        logger.error(f"Error submitting access request: {e}")
        return {"error": str(e)}


class HealthPlugin(PluginBase):
    """Plugin for health and status monitoring functions."""
    
    @property
    def category(self) -> str:
        return "health"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="get_health_status",
                func=apply_middleware(get_health_status),
                category=self.category,
                description="Gets the health status of the API server",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="get_status_health",
                func=apply_middleware(get_status_health),
                category=self.category,
                description="Gets the status health check of the API server",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="submit_access_request",
                func=apply_middleware(submit_access_request, [
                    validation_middleware(["email"])
                ]),
                category=self.category,
                description="Submits an access request to the system",
                schema={
                    "type": "object",
                    "properties": {
                        "email": {"type": "string", "format": "email", "description": "Email address"},
                        "reason": {"type": "string", "description": "Reason for access request"},
                        "organization": {"type": "string", "description": "Organization name"},
                        "use_case": {"type": "string", "description": "Use case description"}
                    },
                    "required": ["email"]
                }
            )
        ]


def get_plugin() -> HealthPlugin:
    """Get the health plugin instance."""
    return HealthPlugin()