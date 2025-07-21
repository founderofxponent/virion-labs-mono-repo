"""Access request management functions."""

import asyncio
from datetime import datetime
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware
from server import token_context


async def list_access_requests(_params: dict) -> dict:
    """Retrieves a list of all access requests."""
    try:
        token = token_context.get()
        result = await api_client.list_access_requests(token=token)
        return result
    except Exception as e:
        logger.error(f"Error listing access requests: {e}")
        return {"error": str(e)}


async def approve_access_request(params: dict) -> dict:
    """Approves a pending access request."""
    try:
        token = token_context.get()
        request_id = params["request_id"]
        result = await api_client.update_access_request(request_id, "approve", token=token)
        return result
    except Exception as e:
        logger.error(f"Error approving access request: {e}")
        return {"error": str(e)}


async def deny_access_request(params: dict) -> dict:
    """Denies a pending access request by marking it as updated."""
    try:
        token = token_context.get()
        request_id = params["request_id"]
        result = await api_client.update_access_request(request_id, "deny", token=token)
        return result
    except Exception as e:
        logger.error(f"Error denying access request: {e}")
        return {"error": str(e)}


class AccessPlugin(PluginBase):
    """Plugin for access request management functions."""
    
    @property
    def category(self) -> str:
        return "access"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="list_access_requests",
                func=apply_middleware(list_access_requests),
                category=self.category,
                description="Lists all access requests",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="approve_access_request",
                func=apply_middleware(approve_access_request, [
                    validation_middleware(["request_id"])
                ]),
                category=self.category,
                description="Approves an access request",
                schema={
                    "type": "object",
                    "properties": {
                        "request_id": {"type": "string", "description": "Access request UUID"}
                    },
                    "required": ["request_id"]
                }
            ),
            FunctionSpec(
                name="deny_access_request",
                func=apply_middleware(deny_access_request, [
                    validation_middleware(["request_id"])
                ]),
                category=self.category,
                description="Denies an access request",
                schema={
                    "type": "object",
                    "properties": {
                        "request_id": {"type": "string", "description": "Access request UUID"}
                    },
                    "required": ["request_id"]
                }
            )
        ]


def get_plugin() -> AccessPlugin:
    """Get the access plugin instance."""
    return AccessPlugin()